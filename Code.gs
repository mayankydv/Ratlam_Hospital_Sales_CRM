/**
 * MedTrack CRM - Google Apps Script Backend (Code.gs)
 * Paste this script in the Apps Script Editor attached to your Google Sheet.
 * Deploy as a Web App: Execute as "Me", Access: "Anyone".
 */

// Global Sheet Configuration
const SHEET_SCHEMAS = {
  Users: ["Name", "PIN", "Role", "Active"],
  Leads: ["LeadID", "Organisation", "POC1Name", "POC1Phone", "POC1Specialization", "POC2Name", "POC2Phone", "POC2Specialization", "AudienceType", "Owner", "GPS", "Status", "Followup", "RevenuePotential", "NonConversionReason", "NonConversionAction", "CreatedAt", "UpdatedAt", "Archived", "CustomFields", "POC1", "POC2"],
  Meetings: ["MeetingID", "LeadID", "Purpose", "Notes", "Outcome", "Owner", "GPS", "Date", "Followup", "CreatedAt", "Archived", "Photo", "CustomFields"],
  Referrals: ["ReferralID", "LeadID", "PatientName", "PatientPhone", "VisitDate", "Reached", "OPD", "IPD", "Investigations", "Medicines", "Consultation", "ReceptionEnquiry", "AdmissionID", "Remarks", "Owner", "CreatedAt", "UpdatedAt", "Archived", "CustomFields"],
  Config: ["ConfigKey", "ConfigValue"],
  FormFields: ["ID", "Label", "Type", "Mandatory", "Options", "Active", "Target"],
  StandardFields: ["ID", "Label", "Mandatory", "Target", "Active", "Type", "Options"]
};

/**
 * Serves GET Requests: Reading Data
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    initializeSpreadsheet(); // Ensure sheets and headers exist
    
    if (action === "getData") {
      const data = fetchAllTables();
      return jsonResponse({ success: true, ...data });
    }
    
    return jsonResponse({ success: true, message: "MedTrack GAS Sync Server Running. Use POST to sync." });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Serves POST Requests: Writing and Syncing Data
 */
function doPost(e) {
  try {
    initializeSpreadsheet();
    
    const payload = JSON.parse(e.postData.contents);
    const isNewClient = (payload.appVersion === "v25");
    
    // Sync each table from payload (Config/Users require new client to prevent rollback overrides)
    if (payload.users && isNewClient) syncUsers(payload.users);
    if (payload.config && isNewClient) syncConfig(payload.config);
    if (payload.formFields && isNewClient) syncFormFields(payload.formFields);
    if (payload.standardFields && isNewClient) syncStandardFields(payload.standardFields);
    if (payload.leads) syncLeads(payload.leads);
    if (payload.meetings) syncMeetings(payload.meetings);
    if (payload.referrals) syncReferrals(payload.referrals);
    
    // Fetch fresh merged state to send back to client
    const freshData = fetchAllTables();
    
    return jsonResponse({ success: true, ...freshData });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Returns JSON formatted output with CORS headers
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates sheets and headers if they do not exist
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(SHEET_SCHEMAS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, SHEET_SCHEMAS[sheetName].length)
           .setValues([SHEET_SCHEMAS[sheetName]])
           .setFontWeight("bold")
           .setBackground("#f1f5f9");
      
      // Seed initial data if sheet is new
      seedInitialData(sheetName, sheet);
    } else {
      // Sheet exists, check if any schema headers are missing and auto-append them
      const lastCol = sheet.getLastColumn();
      let existingHeaders = [];
      if (lastCol > 0) {
        existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().trim());
      }
      const schemaHeaders = SHEET_SCHEMAS[sheetName];
      const missingHeaders = schemaHeaders.filter(h => existingHeaders.indexOf(h) === -1);
      
      if (missingHeaders.length > 0) {
        const startCol = lastCol + 1;
        sheet.getRange(1, startCol, 1, missingHeaders.length)
             .setValues([missingHeaders])
             .setFontWeight("bold")
             .setBackground("#f1f5f9");
      }
    }
  });
}

/**
 * Read all rows from a sheet as an array of objects mapping headers to values
 */
function readSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  
  // Read actual columns based on Row 1 in sheet
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().trim());
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  const results = [];
  const schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
  
  values.forEach(row => {
    // Determine primary ID column position dynamically
    const primaryIdHeader = schemaHeaders[0];
    const idColIdx = headers.indexOf(primaryIdHeader);
    const idVal = idColIdx !== -1 ? row[idColIdx] : "";
    
    if (idVal === undefined || idVal === null || idVal.toString().trim() === "") return; // Skip empty rows
    
    const obj = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      let val = row[idx];
      // Parse JSON fields
      if ((h === "CustomFields" || h === "Options") && val) {
        try {
          val = JSON.parse(val);
        } catch(e) {
          // Fallback if not JSON string
        }
      }
      // Handle active/archived booleans from Sheets
      if (h === "Active" || h === "Archived" || h === "Mandatory" || h === "OPD" || h === "IPD" || h === "Investigations" || h === "Medicines" || h === "Consultation" || h === "ReceptionEnquiry") {
        val = (val === true || val === "TRUE" || val === "true");
      }
      obj[camelCase(h)] = val;
    });
    results.push(obj);
  });
  return results;
}

/**
 * Fetch all tables
 */
function fetchAllTables() {
  // Fetch Config needs special reshaping
  const rawConfig = readSheetData("Config");
  const config = {};
  rawConfig.forEach(row => {
    const key = row.configKey;
    const val = row.configValue;
    if (!config[key]) config[key] = [];
    config[key].push(val);
  });

  return {
    users: readSheetData("Users"),
    config: Object.keys(config).length > 0 ? config : null,
    formFields: readSheetData("FormFields"),
    standardFields: readSheetData("StandardFields"),
    leads: readSheetData("Leads"),
    meetings: readSheetData("Meetings"),
    referrals: readSheetData("Referrals")
  };
}

/**
 * Overwrites sheet values completely (for Users, Config, FormFields)
 */
function overwriteSheet(sheetName, objects) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  const schemaHeaders = SHEET_SCHEMAS[sheetName];
  let lastCol = sheet.getLastColumn();
  let headers = [];
  
  if (lastCol > 0) {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h.toString().trim());
  }
  
  // Initialize headers if empty
  if (headers.length === 0 || !headers[0]) {
    headers = schemaHeaders;
    sheet.getRange(1, 1, 1, headers.length)
         .setValues([headers])
         .setFontWeight("bold")
         .setBackground("#f1f5f9");
    lastCol = headers.length;
  }
  
  // Clear contents below header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  
  if (objects.length === 0) return;
  
  const values = objects.map(obj => {
    return headers.map(h => {
      if (!h) return "";
      let val = obj[camelCase(h)];
      if (val === undefined || val === null) {
        val = "";
      }
      if (typeof val === "object" && val !== "") {
        val = JSON.stringify(val);
      }
      return val;
    });
  });
  
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

/**
 * Upsert records based on ID and updatedAt timestamps (Leads and Meetings)
 */
function syncLeads(incomingLeads) {
  const existingLeads = readSheetData("Leads");
  const leadsMap = {};
  
  // Map existing by ID
  existingLeads.forEach(l => {
    leadsMap[l.leadId] = l;
  });
  
  // Merge incoming
  incomingLeads.forEach(incoming => {
    const existing = leadsMap[incoming.leadId];
    if (!existing) {
      leadsMap[incoming.leadId] = incoming;
    } else {
      // Conflict Resolution: Keep the record with the newer updatedAt timestamp
      const incomingTime = new Date(incoming.updatedAt || 0).getTime();
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      if (incomingTime > existingTime) {
        leadsMap[incoming.leadId] = incoming;
      }
    }
  });
  
  overwriteSheet("Leads", Object.values(leadsMap));
}

function syncMeetings(incomingMeetings) {
  const existingMeetings = readSheetData("Meetings");
  const meetingsMap = {};
  
  existingMeetings.forEach(m => {
    meetingsMap[m.meetingId] = m;
  });
  
  incomingMeetings.forEach(incoming => {
    const existing = meetingsMap[incoming.meetingId];
    if (!existing) {
      meetingsMap[incoming.meetingId] = incoming;
    } else {
      // Use createdAt/date comparison if updatedAt is missing
      const incomingTime = new Date(incoming.createdAt || 0).getTime();
      const existingTime = new Date(existing.createdAt || 0).getTime();
      if (incomingTime > existingTime) {
        meetingsMap[incoming.meetingId] = incoming;
      }
    }
  });
  
  overwriteSheet("Meetings", Object.values(meetingsMap));
}

function syncReferrals(incomingReferrals) {
  const existingReferrals = readSheetData("Referrals");
  const referralsMap = {};
  
  existingReferrals.forEach(r => {
    referralsMap[r.referralId] = r;
  });
  
  incomingReferrals.forEach(incoming => {
    const existing = referralsMap[incoming.referralId];
    if (!existing) {
      referralsMap[incoming.referralId] = incoming;
    } else {
      const incomingTime = new Date(incoming.updatedAt || incoming.createdAt || 0).getTime();
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (incomingTime > existingTime) {
        referralsMap[incoming.referralId] = incoming;
      }
    }
  });
  
  overwriteSheet("Referrals", Object.values(referralsMap));
}

function syncUsers(users) {
  overwriteSheet("Users", users);
}

function syncFormFields(fields) {
  overwriteSheet("FormFields", fields);
}

function syncStandardFields(fields) {
  overwriteSheet("StandardFields", fields);
}

function syncConfig(configObj) {
  const rows = [];
  Object.keys(configObj).forEach(key => {
    const values = configObj[key];
    values.forEach(val => {
      rows.push({ configKey: key, configValue: val });
    });
  });
  overwriteSheet("Config", rows);
}

/**
 * Seed initial data if starting with a blank sheet
 */
function seedInitialData(sheetName, sheet) {
  let initialRows = [];
  
  if (sheetName === "Users") {
    initialRows = [
      ["Rahul", "1111", "Rep", true],
      ["Mayank", "6842", "Manager", true],
      ["Admin", "9999", "Admin", true]
    ];
  } else if (sheetName === "Config") {
    initialRows = [
      ["audienceTypes", "Clinic"],
      ["audienceTypes", "Hospital"],
      ["audienceTypes", "Doctor"],
      ["audienceTypes", "Diagnostic Centre"],
      ["meetingPurposes", "First Contact"],
      ["meetingPurposes", "Follow Up"],
      ["meetingPurposes", "Proposal Review"],
      ["meetingPurposes", "Contract Negotiation"],
      ["meetingPurposes", "Closure"],
      ["leadStatuses", "Contacted"],
      ["leadStatuses", "Qualified"],
      ["leadStatuses", "Referral Started"],
      ["leadStatuses", "Converted"],
      ["leadStatuses", "Lost"],
      ["meetingOutcomes", "Interested"],
      ["meetingOutcomes", "Proposal Submitted"],
      ["meetingOutcomes", "Referral Started"],
      ["meetingOutcomes", "Lost Opportunity"],
      ["meetingOutcomes", "No Response"],
      ["meetingOutcomes", "Postponed"],
      ["nonConversionReasons", "Pricing too high"],
      ["nonConversionReasons", "Doctor aligned elsewhere"],
      ["nonConversionReasons", "Lack of specialities"],
      ["nonConversionReasons", "Distance issue"],
      ["nonConversionReasons", "Service delay"],
      ["nonConversionReasons", "Other"]
    ];
  } else if (sheetName === "FormFields") {
    initialRows = [
      ["speciality", "Speciality Focus", "dropdown", true, JSON.stringify(["Cardiology", "Neurology", "Orthopaedics", "Oncology", "Paediatrics", "General Medicine"]), true, "lead"],
      ["referralPotentialVolume", "Est. Monthly Referrals", "number", false, "[]", true, "lead"],
      ["competitorActivity", "Competitor presence notes", "textarea", false, "[]", true, "lead"]
    ];
  }
  
  if (initialRows.length > 0) {
    sheet.getRange(2, 1, initialRows.length, initialRows[0].length).setValues(initialRows);
  }
}

// Helper: Convert Title Case sheet header to camelCase property name
function camelCase(str) {
  if (str === "LeadID") return "leadId";
  if (str === "MeetingID") return "meetingId";
  if (str === "ReferralID") return "referralId";
  if (str === "AdmissionID") return "admissionId";
  if (str === "POC1") return "poc1";
  if (str === "POC2") return "poc2";
  if (str === "POC1Name") return "poc1Name";
  if (str === "POC1Phone") return "poc1Phone";
  if (str === "POC1Specialization") return "poc1Specialization";
  if (str === "POC2Name") return "poc2Name";
  if (str === "POC2Phone") return "poc2Phone";
  if (str === "POC2Specialization") return "poc2Specialization";
  if (str === "GPS") return "gps";
  if (str === "OPD") return "opd";
  if (str === "IPD") return "ipd";
  if (str === "PIN") return "pin";
  if (str === "ID") return "id";
  return str.charAt(0).toLowerCase() + str.slice(1);
}
