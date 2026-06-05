// MedTrack CRM - Core Controller Logic (app.js)

// --- CONFIG & CONSTANTS ---
const DEFAULT_CONFIG = {
  audienceTypes: ["Clinic", "Hospital", "Doctor", "Diagnostic Centre"],
  meetingPurposes: ["First Contact", "Follow Up", "Proposal Review", "Contract Negotiation", "Closure"],
  leadStatuses: ["Contacted", "Qualified", "Referral Started", "Converted", "Lost"],
  meetingOutcomes: ["Interested", "Proposal Submitted", "Referral Started", "Lost Opportunity", "No Response", "Postponed"],
  nonConversionReasons: ["Pricing too high", "Doctor aligned elsewhere", "Lack of specialities", "Distance issue", "Service delay", "Other"]
};

const DEFAULT_USERS = [
  { name: "Rahul", pin: "1111", role: "Rep", active: true },
  { name: "Mayank", pin: "6842", role: "Manager", active: true },
  { name: "Admin", pin: "9999", role: "Admin", active: true }
];

const DEFAULT_FORM_FIELDS = [
  { id: "speciality", label: "Speciality Focus", type: "dropdown", mandatory: true, options: ["Cardiology", "Neurology", "Orthopaedics", "Oncology", "Paediatrics", "General Medicine"], active: true, target: "lead" },
  { id: "referralPotentialVolume", label: "Est. Monthly Referrals", type: "number", mandatory: false, options: [], active: true, target: "lead" },
  { id: "competitorActivity", label: "Competitor presence notes", type: "textarea", mandatory: false, options: [], active: true, target: "lead" }
];

const DEFAULT_LEADS = [
  { leadId: "L-001", organisation: "City Heart Clinic", poc1: "Dr. A.K. Sharma (+91 98765 43210)", poc2: "Amit (Manager)", audienceType: "Clinic", owner: "Rahul", status: "Converted", followup: "2026-06-01", revenuePotential: 45000, nonConversionReason: "", nonConversionAction: "", createdAt: "2026-05-10T10:00:00.000Z", updatedAt: "2026-05-20T14:30:00.000Z", archived: false, customFields: { speciality: "Cardiology", referralPotentialVolume: "15" } },
  { leadId: "L-002", organisation: "Apollo Diagnostic Center", poc1: "Dr. Priya Patel (+91 99988 87766)", poc2: "Sunita (Reception)", audienceType: "Diagnostic Centre", owner: "Rahul", status: "Referral Started", followup: "2026-05-25", revenuePotential: 30000, nonConversionReason: "", nonConversionAction: "", createdAt: "2026-05-12T11:00:00.000Z", updatedAt: "2026-05-21T09:00:00.000Z", archived: false, customFields: { speciality: "Neurology", referralPotentialVolume: "8" } },
  { leadId: "L-003", organisation: "Care Family Hospital", poc1: "Dr. Rajesh Gupta (+91 88877 66554)", poc2: "", audienceType: "Hospital", owner: "Rahul", status: "Lost", followup: "", revenuePotential: 75000, nonConversionReason: "Pricing too high", nonConversionAction: "Offer customized discount package in next cycle", createdAt: "2026-05-05T09:30:00.000Z", updatedAt: "2026-05-18T16:00:00.000Z", archived: false, customFields: { speciality: "Orthopaedics", referralPotentialVolume: "25" } },
  { leadId: "L-004", organisation: "Metro Scan Center", poc1: "Dr. Vinay Roy", poc2: "", audienceType: "Diagnostic Centre", owner: "Mayank", status: "Qualified", followup: "2026-05-26", revenuePotential: 20000, nonConversionReason: "", nonConversionAction: "", createdAt: "2026-05-15T08:00:00.000Z", updatedAt: "2026-05-22T10:30:00.000Z", archived: false, customFields: { speciality: "Oncology", referralPotentialVolume: "10" } },
  { leadId: "L-005", organisation: "Shanti Maternity Home", poc1: "Dr. Sneha Patil", poc2: "", audienceType: "Clinic", owner: "Rahul", status: "Contacted", followup: "2026-05-24", revenuePotential: 15000, nonConversionReason: "", nonConversionAction: "", createdAt: "2026-05-20T15:00:00.000Z", updatedAt: "2026-05-20T15:00:00.000Z", archived: false, customFields: { speciality: "Paediatrics", referralPotentialVolume: "5" } }
];

const DEFAULT_MEETINGS = [
  { meetingId: "M-001", leadId: "L-001", purpose: "First Contact", notes: "Met doctor, briefed about cardiology ICU features. Doctor interested.", outcome: "Interested", owner: "Rahul", gps: "23.3315, 75.0354", date: "2026-05-10", followup: "2026-05-15", createdAt: "2026-05-10T10:30:00.000Z", archived: false },
  { meetingId: "M-002", leadId: "L-001", purpose: "Proposal Review", notes: "Reviewed referral rates structure. Finalized discount on scans.", outcome: "Referral Started", owner: "Rahul", gps: "23.3315, 75.0354", date: "2026-05-15", followup: "2026-05-20", createdAt: "2026-05-15T15:00:00.000Z", archived: false },
  { meetingId: "M-003", leadId: "L-003", purpose: "First Contact", notes: "Introduced our orthopaedic services. Doctor feels price is higher than competitor.", outcome: "Proposal Submitted", owner: "Rahul", gps: "23.3298, 75.0412", date: "2026-05-05", followup: "2026-05-12", createdAt: "2026-05-05T10:00:00.000Z", archived: false },
  { meetingId: "M-004", leadId: "L-003", purpose: "Follow Up", notes: "Followed up with proposal. Doctor declined saying competitor is closer.", outcome: "Lost Opportunity", owner: "Rahul", gps: "23.3298, 75.0412", date: "2026-05-18", followup: "", createdAt: "2026-05-18T16:00:00.000Z", archived: false }
];

function parseLegacyPoc(pocStr) {
  if (!pocStr) return { name: "", phone: "", specialization: "" };
  
  let name = "";
  let phone = "";
  let specialization = "";
  
  const dashParts = pocStr.split(" - ");
  let mainPart = dashParts[0];
  if (dashParts[1]) {
    specialization = dashParts[1].trim();
  }
  
  const parenParts = mainPart.split("(");
  name = parenParts[0].trim();
  if (parenParts[1]) {
    const pValue = parenParts[1].split(")")[0].trim();
    if (pValue.startsWith("+") || /\d/.test(pValue)) {
      phone = pValue;
    } else {
      if (!specialization) {
        specialization = pValue;
      } else {
        phone = pValue;
      }
    }
  }
  
  return { name, phone, specialization };
}

function formatSimpleDate(dateStr) {
  if (!dateStr) return "";
  let clean = String(dateStr).replace(/[\"\\]/g, "").trim();
  clean = clean.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  if (isNaN(monthIndex) || isNaN(day)) return clean;
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[monthIndex] || "";
  
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";
  
  const shortYear = year.slice(-2);
  return `${day}${suffix} ${monthName}'${shortYear}`;
}

// --- DATABASE HANDLER (LOCAL-FIRST) ---
class CRMDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("medtrack_users")) {
      localStorage.setItem("medtrack_users", JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem("medtrack_config")) {
      localStorage.setItem("medtrack_config", JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem("medtrack_form_fields")) {
      localStorage.setItem("medtrack_form_fields", JSON.stringify(DEFAULT_FORM_FIELDS));
    }
    if (!localStorage.getItem("medtrack_leads")) {
      localStorage.setItem("medtrack_leads", JSON.stringify(DEFAULT_LEADS));
    }
    if (!localStorage.getItem("medtrack_meetings")) {
      localStorage.setItem("medtrack_meetings", JSON.stringify(DEFAULT_MEETINGS));
    }
    if (!localStorage.getItem("medtrack_referrals")) {
      localStorage.setItem("medtrack_referrals", JSON.stringify([]));
    }
    const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbx1H5HQDxibfrffqVuM3xj5vUXYU1aP4EOe5Sfjk0D2jIUfeydfK0XmCUGbQ-hx98-1/exec"; // Paste your Google Apps Script Web App URL here for automatic setup!
    const currentUrl = localStorage.getItem("medtrack_sync_url");
    if (DEFAULT_SYNC_URL && currentUrl !== DEFAULT_SYNC_URL) {
      localStorage.setItem("medtrack_sync_url", DEFAULT_SYNC_URL);
    }
    if (!localStorage.getItem("medtrack_last_sync")) {
      localStorage.setItem("medtrack_last_sync", "Never");
    }
    if (!localStorage.getItem("medtrack_share_settings")) {
      const defaultSettings = {
        showStatus: true,
        showPoc1: true,
        showOwner: true,
        showRevenue: true,
        showLeadId: true,
        showAudience: true,
        showFollowup: true,
        showSpeciality: true,
        captionText: "Check out the details for referral lead: {organisation}"
      };
      localStorage.setItem("medtrack_share_settings", JSON.stringify(defaultSettings));
    }
    let stdFields = [];
    try {
      stdFields = JSON.parse(localStorage.getItem("medtrack_standard_fields")) || [];
    } catch(e) {}
    
    // Remove old merged POC fields if present to trigger upgrade
    let updated = false;
    if (stdFields.some(f => f.id === "leadPoc1" || f.id === "leadPoc2")) {
      stdFields = stdFields.filter(f => f.id !== "leadPoc1" && f.id !== "leadPoc2");
      updated = true;
    }
    
    const defaultStdFields = [
      { id: "leadOrg", label: "Hospital / Clinic Organisation", mandatory: true, target: "lead", active: true },
      { id: "leadPoc1Name", label: "Primary POC: Doctor Name", mandatory: true, target: "lead", active: true },
      { id: "leadPoc1Phone", label: "Primary POC: Phone Number", mandatory: true, target: "lead", active: true },
      { id: "leadPoc1Specialization", label: "Primary POC: Specialization Focus", mandatory: false, target: "lead", active: true },
      { id: "leadPoc2Name", label: "Secondary POC: Name", mandatory: false, target: "lead", active: true },
      { id: "leadPoc2Phone", label: "Secondary POC: Phone Number", mandatory: false, target: "lead", active: true },
      { id: "leadPoc2Specialization", label: "Secondary POC: Specialization / Designation", mandatory: false, target: "lead", active: true },
      { id: "leadAudience", label: "Audience Type", mandatory: false, target: "lead", active: true },
      { id: "leadStatus", label: "Referral Status", mandatory: false, target: "lead", active: true },
      { id: "leadRevenue", label: "Est. Revenue Value (₹)", mandatory: true, target: "lead", active: true },
      { id: "leadFollowup", label: "Next Action Date", mandatory: false, target: "lead", active: true },
      { id: "leadGps", label: "Establishment GPS Location", mandatory: false, target: "lead", active: true },
      { id: "meetingLeadId", label: "Select Hospital Lead", mandatory: true, target: "meeting", active: true },
      { id: "meetingPurpose", label: "Meeting Purpose", mandatory: false, target: "meeting", active: true },
      { id: "meetingOutcome", label: "Outcome Status", mandatory: false, target: "meeting", active: true },
      { id: "meetingNotes", label: "Interaction Summary Notes", mandatory: true, target: "meeting", active: true },
      { id: "meetingDate", label: "Visit Date", mandatory: true, target: "meeting", active: true },
      { id: "meetingFollowup", label: "Follow-up Date", mandatory: false, target: "meeting", active: true },
      { id: "meetingGps", label: "GPS Visit Verification", mandatory: false, target: "meeting", active: true },
      { id: "meetingPhoto", label: "Log Photo Proof (Visits proof)", mandatory: false, target: "meeting", active: true },
      { id: "referralLeadId", label: "Select Hospital / Clinic Lead", mandatory: true, target: "referral", active: true },
      { id: "refPatientName", label: "Patient Full Name", mandatory: true, target: "referral", active: true },
      { id: "refPatientPhone", label: "Patient Phone Number", mandatory: true, target: "referral", active: true },
      { id: "refVisitDate", label: "Expected Visit Date", mandatory: true, target: "referral", active: true },
      { id: "refRemarks", label: "Remark (If Any)", mandatory: false, target: "referral", active: true }
    ];

    if (stdFields.length === 0) {
      localStorage.setItem("medtrack_standard_fields", JSON.stringify(defaultStdFields));
    } else {
      // Ensure all existing fields are upgraded and have the active flag explicitly defined
      stdFields.forEach(f => {
        if (f.active === undefined) {
          f.active = true;
          updated = true;
        }
      });
      defaultStdFields.forEach(df => {
        if (!stdFields.some(f => f.id === df.id)) {
          stdFields.push(df);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem("medtrack_standard_fields", JSON.stringify(stdFields));
      }
    }
  }

  // Generic Getters / Setters
  get(key) {
    return JSON.parse(localStorage.getItem(`medtrack_${key}`)) || [];
  }

  set(key, data) {
    localStorage.setItem(`medtrack_${key}`, JSON.stringify(data));
  }

  // Specific APIs
  getUsers() {
    let users = this.get("users") || [];
    // If empty or missing basic users, restore DEFAULT_USERS
    if (users.length === 0) {
      users = [
        { id: "Rahul", name: "Rahul", pin: "1111", role: "Rep", active: true },
        { id: "Mayank", name: "Mayank", pin: "6842", role: "Manager", active: true },
        { id: "Admin", name: "Admin", pin: "9999", role: "Admin", active: true }
      ];
      this.set("users", users);
    }
    // Double check that the admin user exists in the list to prevent lockout
    if (!users.some(u => String(u.pin) === "9999")) {
      users.push({ id: "Admin", name: "Admin", pin: "9999", role: "Admin", active: true });
      this.set("users", users);
    }
    let updated = false;
    const mapped = users.map(u => {
      if (u && u.pin !== undefined && u.pin !== null) {
        u.pin = String(u.pin);
      }
      if (u && !u.id) {
        u.id = u.name;
        updated = true;
      }
      return u;
    });
    if (updated) {
      this.set("users", mapped);
    }
    return mapped.filter(u => u && !u.archived);
  }
  saveUsers(users) {
    const fullUsers = this.get("users") || [];
    users.forEach(u => {
      const idx = fullUsers.findIndex(fu => fu.id === u.id || fu.name === u.name);
      if (idx !== -1) {
        fullUsers[idx] = { ...fullUsers[idx], ...u };
      } else {
        fullUsers.push(u);
      }
    });
    this.set("users", fullUsers);
    localStorage.setItem("medtrack_pending_config_push", "true");
  }

  getConfig() { return JSON.parse(localStorage.getItem("medtrack_config")) || DEFAULT_CONFIG; }
  saveConfig(config) {
    localStorage.setItem("medtrack_config", JSON.stringify(config));
    localStorage.setItem("medtrack_pending_config_push", "true");
  }

  getCustomReports() {
    const config = this.getConfig();
    const rawReports = config.customReports || [];
    return rawReports.map(r => {
      try {
        return typeof r === 'string' ? JSON.parse(r) : r;
      } catch (e) {
        console.error("Error parsing custom report", e);
        return null;
      }
    }).filter(r => r !== null);
  }
  saveCustomReports(reports) {
    const config = this.getConfig();
    config.customReports = reports.map(r => typeof r === 'string' ? r : JSON.stringify(r));
    this.saveConfig(config);
  }

  getFormFields() {
    const fields = this.get("form_fields") || [];
    return fields.filter(f => f && !f.archived);
  }
  saveFormFields(fields) {
    const fullFields = this.get("form_fields") || [];
    fields.forEach(f => {
      const idx = fullFields.findIndex(ff => ff.id === f.id);
      if (idx !== -1) {
        fullFields[idx] = { ...fullFields[idx], ...f };
      } else {
        fullFields.push(f);
      }
    });
    this.set("form_fields", fullFields);
    localStorage.setItem("medtrack_pending_config_push", "true");
  }

  getLeads() {
    const rawLeads = this.get("leads") || [];
    return rawLeads.filter(l => l && l.leadId && !l.archived).map(l => {
      // Migrate old schema fields on the fly
      if (l.poc1 && !l.poc1Name) {
        const p1 = parseLegacyPoc(l.poc1);
        l.poc1Name = p1.name;
        l.poc1Phone = p1.phone;
        l.poc1Specialization = p1.specialization || l.customFields?.speciality || "";
      }
      if (l.poc2 && !l.poc2Name) {
        const p2 = parseLegacyPoc(l.poc2);
        l.poc2Name = p2.name;
        l.poc2Phone = p2.phone;
        l.poc2Specialization = p2.specialization || "";
      }
      // Ensure properties exist to prevent undefined references
      l.poc1Name = l.poc1Name || "";
      l.poc1Phone = l.poc1Phone || "";
      l.poc1Specialization = l.poc1Specialization || "";
      l.poc2Name = l.poc2Name || "";
      l.poc2Phone = l.poc2Phone || "";
      l.poc2Specialization = l.poc2Specialization || "";
      return l;
    });
  }
  saveLead(lead) {
    const leads = this.get("leads");
    lead.updatedAt = new Date().toISOString();
    const idx = leads.findIndex(l => l.leadId === lead.leadId);
    if (idx !== -1) {
      leads[idx] = lead;
    } else {
      lead.createdAt = lead.updatedAt;
      leads.push(lead);
    }
    this.set("leads", leads);
  }

  getMeetings() { return (this.get("meetings") || []).filter(m => m && m.meetingId && !m.archived); }
  saveMeeting(meeting) {
    const meetings = this.get("meetings");
    meeting.createdAt = meeting.createdAt || new Date().toISOString();
    const idx = meetings.findIndex(m => m.meetingId === meeting.meetingId);
    if (idx !== -1) {
      meetings[idx] = meeting;
    } else {
      meetings.push(meeting);
    }
    this.set("meetings", meetings);
  }

  getReferrals() { return (this.get("referrals") || []).filter(r => r && r.referralId && !r.archived); }
  saveReferral(referral) {
    const referrals = this.get("referrals");
    referral.createdAt = referral.createdAt || new Date().toISOString();
    referral.updatedAt = new Date().toISOString();
    const idx = referrals.findIndex(r => r.referralId === referral.referralId);
    if (idx !== -1) {
      referrals[idx] = referral;
    } else {
      referrals.push(referral);
    }
    this.set("referrals", referrals);
  }

  getSyncSettings() {
    return {
      url: localStorage.getItem("medtrack_sync_url") || "",
      lastSync: localStorage.getItem("medtrack_last_sync") || "Never"
    };
  }

  saveSyncSettings(url) {
    localStorage.setItem("medtrack_sync_url", url);
  }

  getShareSettings() {
    return JSON.parse(localStorage.getItem("medtrack_share_settings")) || {
      showStatus: true, showPoc1: true, showOwner: true, showRevenue: true,
      showLeadId: true, showAudience: true, showFollowup: true, showSpeciality: true,
      captionText: "Check out the details for referral lead: {organisation}"
    };
  }

  saveShareSettings(settings) {
    localStorage.setItem("medtrack_share_settings", JSON.stringify(settings));
  }

  getStandardFields() {
    return JSON.parse(localStorage.getItem("medtrack_standard_fields")) || [];
  }

  saveStandardFields(fields) {
    localStorage.setItem("medtrack_standard_fields", JSON.stringify(fields));
    localStorage.setItem("medtrack_pending_config_push", "true");
  }

  clearCache() {
    localStorage.removeItem("medtrack_users");
    localStorage.removeItem("medtrack_config");
    localStorage.removeItem("medtrack_form_fields");
    localStorage.removeItem("medtrack_leads");
    localStorage.removeItem("medtrack_meetings");
    localStorage.removeItem("medtrack_referrals");
    localStorage.removeItem("medtrack_last_sync");
    localStorage.removeItem("medtrack_share_settings");
    localStorage.removeItem("medtrack_standard_fields");
    this.init();
  }
}

const db = new CRMDatabase();

// --- STATE MANAGEMENT ---
let currentUser = null;
let currentPinInput = "";
let selectedLead = null;
let photoPreviewBase64 = null;
let activeReportsTimeframe = "all";

// --- ROUTING ---
const routes = {
  "#/login": { view: "loginView", title: "Login", permission: ["Rep", "Manager", "Admin"] },
  "#/dashboard": { view: "dashboardView", title: "Dashboard", permission: ["Rep", "Manager", "Admin"] },
  "#/leads": { view: "leadsView", title: "Leads", permission: ["Rep", "Manager", "Admin"] },
  "#/meetings": { view: "meetingsView", title: "Meetings List", permission: ["Rep", "Manager", "Admin"] },
  "#/referrals": { view: "referralsView", title: "Patient Referrals", permission: ["Rep", "Manager", "Admin"] },
  "#/admin": { view: "adminView", title: "Admin Panel", permission: ["Admin"] }
};

function handleRouting() {
  const fullHash = window.location.hash || "#/login";
  const [hash, queryString] = fullHash.split("?");
  const params = new URLSearchParams(queryString || "");
  const activeSheet = params.get("sheet");
  
  // Verify Session
  checkSession();

  if (!currentUser && hash !== "#/login") {
    window.location.hash = "#/login";
    return;
  }

  if (currentUser && hash === "#/login") {
    window.location.hash = "#/dashboard";
    return;
  }

  const route = routes[hash];
  if (!route) {
    window.location.hash = "#/dashboard";
    return;
  }

  // Check Role Permissions
  if (currentUser && !route.permission.includes(currentUser.role)) {
    showToast("Access Denied: Insufficient Permissions", "error");
    window.location.hash = "#/dashboard";
    return;
  }

  // Render Views
  document.querySelectorAll(".view-container").forEach(el => el.classList.remove("active"));
  const viewEl = document.getElementById(route.view);
  if (viewEl) viewEl.classList.add("active");

  // Highlight bottom navigation tabs
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  const activeNavItem = document.querySelector(`.nav-item[href="${hash}"]`);
  if (activeNavItem) activeNavItem.classList.add("active");

  // Load view contents
  initView(hash);

  // Manage all sheets (modals) based on activeSheet parameter
  manageSheetsRouting(activeSheet, params);
}

// --- SHEET (MODAL) STATE ROUTING HELPERS ---
function showSheet(id, extraParams = {}) {
  const currentViewHash = window.location.hash.split("?")[0] || "#/dashboard";
  const searchParams = new URLSearchParams();
  searchParams.set("sheet", id);
  for (const [k, v] of Object.entries(extraParams)) {
    searchParams.set(k, v);
  }
  window.location.hash = `${currentViewHash}?${searchParams.toString()}`;
}

function closeSheet(id) {
  const currentViewHash = window.location.hash.split("?")[0] || "#/dashboard";
  window.location.hash = currentViewHash;
}
function manageSheetsRouting(activeSheet, params) {
  const sheets = ["leadFormSheet", "meetingFormSheet", "leadDetailSheet", "meetingDetailSheet", "fabSheet", "referralFormSheet", "referralUpdateSheet"];
  
  sheets.forEach(sheetId => {
    const el = document.getElementById(sheetId);
    if (!el) return;
    
    if (activeSheet === sheetId) {
      if (sheetId === "fabSheet") {
        el.classList.add("show");
      } else {
        el.style.display = "flex";
      }
    } else {
      if (sheetId === "fabSheet") {
        el.classList.remove("show");
      } else {
        el.style.display = "none";
      }
    }
  });

  // Populate data for the active sheet if needed
  if (activeSheet === "leadFormSheet") {
    applyStandardFieldsConfig();
    const leadId = params.get("id");
    const defaultStatus = params.get("defaultStatus");
    if (leadId) {
      const lead = db.getLeads().find(l => l.leadId === leadId);
      if (lead) {
        selectedLead = lead;
        populateLeadFormForEdit(lead);
      }
    } else {
      selectedLead = null;
      populateLeadFormForAdd(defaultStatus);
    }
  } else if (activeSheet === "meetingFormSheet") {
    const leadId = params.get("leadId");
    populateMeetingForm(leadId);
  } else if (activeSheet === "leadDetailSheet") {
    const leadId = params.get("id");
    if (leadId) {
      renderLeadDetail(leadId);
    }
  } else if (activeSheet === "meetingDetailSheet") {
    const meetingId = params.get("id");
    if (meetingId) {
      renderMeetingDetail(meetingId);
    }
  } else if (activeSheet === "referralFormSheet") {
    populateReferralFormForAdd();
  } else if (activeSheet === "referralUpdateSheet") {
    const refId = params.get("id");
    if (refId) {
      const ref = db.getReferrals().find(r => r.referralId === refId);
      if (ref) {
        populateReferralUpdateForm(ref);
      }
    }
  }
}

// --- DASHBOARD INTERACTIVE NAVIGATION HELPERS ---
function navigateToTotalLeads() {
  activeStatusFilter = "All";
  window.location.hash = "#/leads";
}

function navigateToMeetings() {
  window.location.hash = "#/meetings";
}

function navigateToActivePipelines() {
  activeStatusFilter = "Active";
  window.location.hash = "#/leads";
}

function navigateToDueFollowups() {
  activeStatusFilter = "Due";
  window.location.hash = "#/leads";
}

function checkSession() {
  const session = localStorage.getItem("medtrack_session");
  if (session) {
    const sessionUser = JSON.parse(session);
    const users = db.getUsers();
    const dbUser = users.find(u => u.id === sessionUser.id || u.name === sessionUser.name);
    
    // If the user was deleted or deactivated
    if (!dbUser || !dbUser.active) {
      localStorage.removeItem("medtrack_session");
      currentUser = null;
      showToast("Your session has expired or your account was deactivated.", "warning");
      window.location.hash = "#/login";
      return;
    }
    
    // If the PIN has been changed
    if (dbUser.pin !== sessionUser.pin) {
      localStorage.removeItem("medtrack_session");
      currentUser = null;
      showToast("Your PIN has been changed. Please log in again with your new PIN.", "warning");
      window.location.hash = "#/login";
      return;
    }
    
    currentUser = dbUser; // Sync with fresh database details (role changes, etc.)
    localStorage.setItem("medtrack_session", JSON.stringify(dbUser));
    
    // Update UI headers
    document.getElementById("navBar").style.display = "flex";
    document.getElementById("appHeader").style.display = "flex";
    document.getElementById("currentUserLabel").innerText = `${currentUser.name} (${currentUser.role})`;
    
    // Hide tabs based on roles
    const managerTabs = document.querySelectorAll(".nav-manager-only");
    const adminTabs = document.querySelectorAll(".nav-admin-only");
    
    if (currentUser.role === "Rep") {
      managerTabs.forEach(t => t.style.display = "none");
      adminTabs.forEach(t => t.style.display = "none");
    } else if (currentUser.role === "Manager") {
      managerTabs.forEach(t => t.style.display = "");
      adminTabs.forEach(t => t.style.display = "none");
    } else {
      managerTabs.forEach(t => t.style.display = "");
      adminTabs.forEach(t => t.style.display = "");
    }
  } else {
    currentUser = null;
    document.getElementById("navBar").style.display = "none";
    document.getElementById("appHeader").style.display = "none";
  }
}

// --- DYNAMIC VIEW INITIALIZERS ---
function initView(hash) {
  switch (hash) {
    case "#/login":
      // Only reset pin display if currentPinInput is empty to avoid clearing user's keystrokes
      if (currentPinInput === "") {
        resetPinDisplay();
      }
      break;
    case "#/dashboard":
      renderDashboard();
      break;
    case "#/leads":
      renderLeadsList();
      break;
    case "#/meetings":
      renderMeetingsList();
      break;
    case "#/referrals":
      renderReferralsList();
      break;
    case "#/admin":
      renderAdminPanel();
      break;
  }
}

// --- AUTHENTICATION ACTIONS ---
function handlePinKey(key) {
  if (key === "clear") {
    currentPinInput = "";
  } else if (key === "backspace") {
    currentPinInput = currentPinInput.slice(0, -1);
  } else if (currentPinInput.length < 4) {
    currentPinInput += key;
  }

  updatePinDots();

  if (currentPinInput.length === 4) {
    // Validate PIN
    const users = db.getUsers();
    const matchedUser = users.find(u => u.pin === currentPinInput && u.active);
    
    if (matchedUser) {
      localStorage.setItem("medtrack_session", JSON.stringify(matchedUser));
      currentUser = matchedUser; // Set immediately
      showToast(`Welcome back, ${matchedUser.name}!`, "success");
      currentPinInput = "";
      triggerSync(true); // Trigger sync immediately to load history!
      setTimeout(() => {
        window.location.hash = "#/dashboard";
      }, 500);
    } else {
      const errEl = document.getElementById("authError");
      errEl.classList.add("show");
      currentPinInput = "";
      if (navigator.onLine && db.getSyncSettings().url) {
        triggerSync(true); // Pull latest user DB / PIN changes from server
      }
      setTimeout(() => {
        errEl.classList.remove("show");
        updatePinDots();
      }, 1500);
    }
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, idx) => {
    if (idx < currentPinInput.length) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

function resetPinDisplay() {
  currentPinInput = "";
  updatePinDots();
}

function logout() {
  localStorage.removeItem("medtrack_session");
  currentUser = null;
  showToast("Logged out successfully", "info");
  window.location.hash = "#/login";
}

// --- DASHBOARD ACTIONS & CHARTS ---
function populateDashboardFilters() {
  const repSelect = document.getElementById("dashboardRepFilter");
  if (!repSelect) return;
  repSelect.innerHTML = "";
  
  if (currentUser.role === "Admin" || currentUser.role === "Manager") {
    const optAll = document.createElement("option");
    optAll.value = "All";
    optAll.innerText = "All Representatives";
    repSelect.appendChild(optAll);
    
    const users = db.getUsers().filter(u => u.active);
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.innerText = u.name;
      repSelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option");
    opt.value = currentUser.id;
    opt.innerText = currentUser.name;
    repSelect.appendChild(opt);
  }
}

function handleDashboardFilterChange() {
  const timeframe = document.getElementById("dashboardTimeframe").value;
  const customInputs = document.getElementById("customDateRangeInputs");
  if (customInputs) {
    if (timeframe === "custom") {
      customInputs.style.display = "flex";
    } else {
      customInputs.style.display = "none";
    }
  }
  renderDashboard();
}

function matchDashboardTimeframe(dateStr) {
  if (!dateStr) return false;
  const itemDate = dateStr.split("T")[0];
  
  const timeframe = document.getElementById("dashboardTimeframe") ? document.getElementById("dashboardTimeframe").value : "all";
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  if (timeframe === "today") {
    return itemDate === todayStr;
  } else if (timeframe === "yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    return itemDate === yesterdayStr;
  } else if (timeframe === "custom") {
    const startInput = document.getElementById("dashboardStartDate") ? document.getElementById("dashboardStartDate").value : "";
    const endInput = document.getElementById("dashboardEndDate") ? document.getElementById("dashboardEndDate").value : "";
    if (!startInput || !endInput) return true;
    return itemDate >= startInput && itemDate <= endInput;
  }
  return true;
}

function renderDashboard() {
  const leads = db.getLeads();
  const meetings = db.getMeetings();
  const referrals = db.getReferrals();

  // Show user greeting on dashboard
  const subtitleEl = document.getElementById("dashboardSubtitle");
  if (subtitleEl && currentUser) {
    subtitleEl.innerHTML = `Welcome back, <strong>${currentUser.name}</strong> (${currentUser.role}) &bull; Referral Performance & Conversion Metrics`;
  }

  // Populate dropdown once
  const repSelect = document.getElementById("dashboardRepFilter");
  if (repSelect && repSelect.children.length === 0) {
    populateDashboardFilters();
  }

  let selectedRep = "All";
  if (repSelect) {
    selectedRep = repSelect.value || "All";
  }
  if (currentUser.role === "Rep") {
    selectedRep = currentUser.id;
  }

  const repFilter = (item) => selectedRep === "All" ? true : item.owner === selectedRep;

  const filteredLeads = leads.filter(repFilter);
  const filteredMeetings = meetings.filter(repFilter);
  const filteredReferrals = referrals.filter(repFilter);

  // Timeframe filtered data subsets
  const leadsInTimeframe = filteredLeads.filter(l => matchDashboardTimeframe(l.createdAt));
  const meetingsInTimeframe = filteredMeetings.filter(m => matchDashboardTimeframe(m.createdAt || m.date));
  const referralsInTimeframe = filteredReferrals.filter(r => matchDashboardTimeframe(r.createdAt || r.visitDate));

  // Metrics calculations
  const totalLeads = filteredLeads.length;
  const activeLeads = filteredLeads.filter(l => l.status !== "Converted" && l.status !== "Lost").length;
  const meetingsCompleted = filteredMeetings.filter(m => m.outcome !== "Postponed").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const pendingFollowups = filteredLeads.filter(l => l.followup && l.followup <= todayStr && l.status !== "Converted" && l.status !== "Lost").length;

  const convertedLeads = filteredLeads.filter(l => l.status === "Converted").length;
  const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Bind Metrics UI
  document.getElementById("metricTotalLeads").innerText = totalLeads;
  document.getElementById("metricMeetings").innerText = meetingsCompleted;
  document.getElementById("metricActiveLeads").innerText = activeLeads;
  document.getElementById("metricFollowups").innerText = pendingFollowups;
  document.getElementById("metricConversionRate").innerText = `${conversionRate}%`;

  // Render Pipeline Funnel Charts
  renderFunnelChart(leadsInTimeframe);
  renderReferralsFunnelChart(referralsInTimeframe);

  // Render Rep Rankings Leaderboard (only meaningful for Admin/Manager)
  renderRepRanking(leads);

  // Render Lost Reasons Pie/Donut Chart
  renderLostReasonsChart(leadsInTimeframe);

  // Render Timeframe Performance summary (Reports tab replacement at bottom)
  const newLeadsTimeframe = leads.filter(repFilter).filter(l => matchDashboardTimeframe(l.createdAt)).length;
  const meetingsTimeframe = meetings.filter(repFilter).filter(m => matchDashboardTimeframe(m.createdAt || m.date)).length;
  const referralsTimeframe = referrals.filter(repFilter).filter(r => matchDashboardTimeframe(r.createdAt || r.visitDate)).length;
  const acquiredValueTimeframe = leads.filter(repFilter).filter(l => l.status === "Converted" && matchDashboardTimeframe(l.updatedAt)).reduce((acc, l) => acc + (l.revenuePotential || 0), 0);

  const repTotalNewLeadsEl = document.getElementById("repTotalNewLeads");
  if (repTotalNewLeadsEl) {
    repTotalNewLeadsEl.innerText = newLeadsTimeframe;
    document.getElementById("repTotalMeetings").innerText = meetingsTimeframe;
    document.getElementById("repTotalReferrals").innerText = referralsTimeframe;
    document.getElementById("repTotalValue").innerText = `₹${acquiredValueTimeframe.toLocaleString()}`;
  }

  // Render Reports Conversion Table logs
  const reportsConversionTable = document.getElementById("reportsConversionTable");
  if (reportsConversionTable) {
    reportsConversionTable.innerHTML = "";
    const timeframeLeads = leads.filter(repFilter).filter(l => matchDashboardTimeframe(l.createdAt) || matchDashboardTimeframe(l.updatedAt));
    
    if (timeframeLeads.length === 0) {
      reportsConversionTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:16px;">No activity in this timeframe</td></tr>`;
    } else {
      timeframeLeads.forEach(lead => {
        const count = meetings.filter(m => m.leadId === lead.leadId).length;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:600; color:var(--primary);">${lead.organisation}</td>
          <td>${lead.audienceType}</td>
          <td>${getUserDisplayName(lead.owner)}</td>
          <td><span class="record-badge badge-${lead.status.toLowerCase().replace(" ", "-")}">${lead.status}</span></td>
          <td style="text-align:center;">${count}</td>
          <td style="text-align:right; font-weight:600;">₹${(lead.revenuePotential || 0).toLocaleString()}</td>
        `;
        reportsConversionTable.appendChild(tr);
      });
    }
  }

  // Render dynamic custom reports
  renderCustomReports();
}

function renderFunnelChart(filteredLeads) {
  const stages = [
    { label: "Visits / Contacts", status: "Contacted" },
    { label: "Qualified Leads", status: "Qualified" },
    { label: "Referrals Started", status: "Referral Started" },
    { label: "Converted Patients", status: "Converted" }
  ];

  const chartEl = document.getElementById("pipelineFunnelChart");
  if (!chartEl) return;
  chartEl.innerHTML = "";

  let count = 0;
  const counts = stages.map(stage => {
    if (stage.status === "Contacted") {
      count = filteredLeads.length;
    } else if (stage.status === "Qualified") {
      count = filteredLeads.filter(l => l.status !== "Contacted").length;
    } else if (stage.status === "Referral Started") {
      count = filteredLeads.filter(l => l.status === "Referral Started" || l.status === "Converted").length;
    } else {
      count = filteredLeads.filter(l => l.status === "Converted").length;
    }
    return { label: stage.label, count };
  });

  const maxCount = counts[0]?.count || 1;

  counts.forEach((item, index) => {
    const widthPct = Math.max(60, Math.round((item.count / maxCount) * 100));
    const opacity = 1 - (index * 0.15);
    
    const stageEl = document.createElement("div");
    stageEl.className = "funnel-stage";
    stageEl.style.width = `${widthPct}%`;
    stageEl.style.backgroundColor = `rgba(15, 76, 97, ${opacity})`;
    stageEl.style.alignSelf = "center";
    
    stageEl.innerHTML = `
      <span class="funnel-stage-label">${item.label}</span>
      <span class="funnel-stage-value">${item.count}</span>
    `;
    chartEl.appendChild(stageEl);
  });
}

function renderReferralsFunnelChart(filteredReferrals) {
  const total = filteredReferrals.length;
  const reached = filteredReferrals.filter(r => r.reached === "Yes").length;
  const ipd = filteredReferrals.filter(r => r.reached === "Yes" && r.reachedDetails?.ipd).length;
  
  const reachedRate = total ? Math.round((reached / total) * 100) : 0;
  
  const metricEl = document.getElementById("metricReferralReachedRate");
  if (metricEl) {
    metricEl.innerText = `${reachedRate}% Reached`;
  }
  
  const stages = [
    { label: "Total Referrals Logged", count: total },
    { label: "Patients Reached Clinic", count: reached },
    { label: "Inpatient Admissions (IPD)", count: ipd }
  ];
  
  const chartEl = document.getElementById("referralsFunnelChart");
  if (!chartEl) return;
  chartEl.innerHTML = "";
  
  const maxCount = stages[0]?.count || 1;
  
  stages.forEach((item, index) => {
    const widthPct = Math.max(60, Math.round((item.count / maxCount) * 100));
    const opacity = 1 - (index * 0.15);
    
    const stageEl = document.createElement("div");
    stageEl.className = "funnel-stage";
    stageEl.style.width = `${widthPct}%`;
    stageEl.style.backgroundColor = `rgba(245, 158, 11, ${opacity})`;
    stageEl.style.alignSelf = "center";
    
    stageEl.innerHTML = `
      <span class="funnel-stage-label">${item.label}</span>
      <span class="funnel-stage-value">${item.count}</span>
    `;
    chartEl.appendChild(stageEl);
  });
}

function renderRepRanking(allLeads) {
  const repStats = {};
  allLeads.forEach(lead => {
    if (!repStats[lead.owner]) {
      repStats[lead.owner] = { name: getUserDisplayName(lead.owner), conversions: 0, revenue: 0 };
    }
    if (lead.status === "Converted") {
      repStats[lead.owner].conversions += 1;
    }
    repStats[lead.owner].revenue += (lead.revenuePotential || 0);
  });

  const repsArray = Object.values(repStats).sort((a, b) => b.revenue - a.revenue);
  const container = document.getElementById("repRankingsChart");
  if (!container) return;
  container.innerHTML = "";

  if (repsArray.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">No Rep data available</div>`;
    return;
  }

  const maxRevenue = repsArray[0].revenue || 1;

  repsArray.forEach(rep => {
    const pct = Math.round((rep.revenue / maxRevenue) * 100);
    const itemEl = document.createElement("div");
    itemEl.className = "ranking-item";
    itemEl.innerHTML = `
      <div class="ranking-meta">
        <span class="ranking-name">${rep.name} (${rep.conversions} Converted)</span>
        <span class="ranking-score">₹${rep.revenue.toLocaleString()}</span>
      </div>
      <div class="ranking-bar-wrapper">
        <div class="ranking-bar" style="width: ${pct}%"></div>
      </div>
    `;
    container.appendChild(itemEl);
  });
}

function renderLostReasonsChart(filteredLeads) {
  const config = db.getConfig();
  const lostLeads = filteredLeads.filter(l => l.status === "Lost");
  
  const reasonCounts = {};
  config.nonConversionReasons.forEach(r => reasonCounts[r] = 0);
  lostLeads.forEach(lead => {
    const r = lead.nonConversionReason || "Other";
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });

  const dataset = Object.entries(reasonCounts).filter(([_, count]) => count > 0);
  const totalLost = lostLeads.length;
  
  const container = document.getElementById("lostReasonsChart");
  container.innerHTML = "";

  if (totalLost === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">No lost opportunities recorded yet. Great!</div>`;
    return;
  }

  // Draw pure SVG pie chart
  let svgContent = `<svg viewBox="0 0 100 100" width="120" height="120" style="transform: rotate(-90deg); flex-shrink:0;">`;
  let cumAngle = 0;
  
  const colors = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981", "#64748b"];

  dataset.forEach(([reason, count], idx) => {
    const pct = count / totalLost;
    const angle = pct * 360;
    
    // Calculate arc path
    const x1 = 50 + 40 * Math.cos((cumAngle * Math.PI) / 180);
    const y1 = 50 + 40 * Math.sin((cumAngle * Math.PI) / 180);
    
    cumAngle += angle;
    
    const x2 = 50 + 40 * Math.cos((cumAngle * Math.PI) / 180);
    const y2 = 50 + 40 * Math.sin((cumAngle * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    svgContent += `<path d="M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[idx % colors.length]}"></path>`;
  });
  
  svgContent += `<circle cx="50" cy="50" r="22" fill="white"></circle>`;
  svgContent += `</svg>`;

  // Create Legend
  let legendContent = `<div style="display:flex; flex-direction:column; gap:6px; flex:1;">`;
  dataset.forEach(([reason, count], idx) => {
    const pct = Math.round((count / totalLost) * 100);
    legendContent += `
      <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem;">
        <span style="width:10px; height:10px; border-radius:50%; background-color:${colors[idx % colors.length]}; display:inline-block;"></span>
        <span style="font-weight:600; flex:1;">${reason}</span>
        <span style="color:var(--text-muted)">${count} (${pct}%)</span>
      </div>
    `;
  });
  legendContent += `</div>`;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.gap = "20px";
  wrap.style.width = "100%";
  wrap.innerHTML = svgContent + legendContent;
  
  container.appendChild(wrap);
}

// --- LEADS ACTIONS ---
let activeStatusFilter = "All";

function renderLeadsList() {
  const leads = db.getLeads();
  const meetings = db.getMeetings();
  const referrals = db.getReferrals();
  const searchVal = document.getElementById("leadSearchInput").value.toLowerCase();
  
  // Reps can only view own leads
  const ownerFilter = (item) => currentUser.role === "Rep" ? item.owner === currentUser.id : true;
  
  // Render Filters chips dynamically
  renderLeadFilterChips(leads);

  const container = document.getElementById("leadsListContainer");
  container.innerHTML = "";

  const filtered = leads
    .filter(ownerFilter)
    .filter(lead => {
      const cleanSearchVal = searchVal.replace(/\s+/g, "").toLowerCase();
      const cleanOrg = (lead.organisation || "").toLowerCase().replace(/\s+/g, "");
      const cleanPoc1 = (lead.poc1 || "").toLowerCase().replace(/\s+/g, "");
      const cleanPoc2 = (lead.poc2 || "").toLowerCase().replace(/\s+/g, "");
      const cleanOwner = (getUserDisplayName(lead.owner) || "").toLowerCase().replace(/\s+/g, "");

      const matchSearch = cleanOrg.includes(cleanSearchVal) || 
                          cleanPoc1.includes(cleanSearchVal) ||
                          cleanPoc2.includes(cleanSearchVal) ||
                          cleanOwner.includes(cleanSearchVal);
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const matchStatus = activeStatusFilter === "All" || 
                          (activeStatusFilter === "Active" && lead.status !== "Converted" && lead.status !== "Lost") ||
                          (activeStatusFilter === "Due" && lead.followup && lead.followup <= todayStr && lead.status !== "Converted" && lead.status !== "Lost") ||
                          lead.status === activeStatusFilter;
      return matchSearch && matchStatus;
    });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:32px 0;">No leads found. Tap the '+' button to add.</div>`;
    return;
  }

  filtered.forEach(lead => {
    const card = document.createElement("div");
    card.className = "record-card glass";
    card.onclick = () => showLeadDetail(lead.leadId);

    const statusBadgeClass = `badge-${(lead.status || "contacted").toLowerCase().replace(" ", "-")}`;
    
    const displayName = (lead.poc1Name || lead.poc1 || "").split("(")[0].trim();
    const truncatedName = displayName.length > 25 ? displayName.substring(0, 22) + "..." : displayName;

    const meetingCount = meetings.filter(m => m.leadId === lead.leadId).length;
    const referralCount = referrals.filter(r => r.leadId === lead.leadId).length;
    
    const getCityFromGps = (gpsStr) => {
      if (!gpsStr) return "";
      const match = gpsStr.match(/\(([^)]+)\)/);
      return match ? match[1] : "";
    };
    const city = getCityFromGps(lead.gps);

    card.innerHTML = `
      <div class="record-header">
        <div class="record-title">${lead.organisation || "Unnamed Organisation"}</div>
        <div class="record-badge ${statusBadgeClass}">${lead.status || "Contacted"}</div>
      </div>
      <div class="record-details">
        <div class="record-detail-item">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
          <span>${truncatedName || "-"}</span>
        </div>
        <div class="record-detail-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${lead.followup ? "Next: " + formatSimpleDate(lead.followup) : "No Followup"}</span>
        </div>
      </div>
      <div class="record-footer" style="flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="record-owner">
            <div class="record-owner-avatar">${getUserDisplayName(lead.owner)[0] || "U"}</div>
            <span>${getUserDisplayName(lead.owner)}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">|</span>
          <span style="font-size:0.75rem; font-weight:600; color:var(--warning);">Referrals: ${referralCount}</span>
          ${city ? `
          <span style="font-size:0.75rem; color:var(--text-muted);">|</span>
          <span style="font-size:0.75rem; font-weight:500; color:var(--primary-light);">📍 ${city}</span>` : ''}
        </div>
        <div class="record-time" style="font-weight: 600; color: var(--primary);">
          Visits: ${meetingCount}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderLeadFilterChips(leads) {
  const container = document.getElementById("leadFilterChips");
  container.innerHTML = "";

  const statuses = ["All", "Active", "Due", ...db.getConfig().leadStatuses];
  
  statuses.forEach(status => {
    const chip = document.createElement("div");
    chip.className = `filter-chip ${activeStatusFilter === status ? "active" : ""}`;
    chip.innerText = status;
    chip.onclick = (e) => {
      e.stopPropagation();
      activeStatusFilter = status;
      renderLeadsList();
    };
    container.appendChild(chip);
  });
}

function toggleLeadFilterSheet() {
  const el = document.getElementById("leadFilterChips");
  el.classList.toggle("show");
}

// --- MEETINGS ACTIONS ---
function renderMeetingsList() {
  const meetings = db.getMeetings();
  const searchVal = document.getElementById("meetingSearchInput").value.toLowerCase();
  const ownerFilter = (item) => currentUser.role === "Rep" ? item.owner === currentUser.id : true;

  const container = document.getElementById("meetingsListContainer");
  container.innerHTML = "";

  const leads = db.getLeads();

  const filtered = meetings
    .filter(ownerFilter)
    .filter(meeting => {
      const cleanSearchVal = searchVal.replace(/\s+/g, "").toLowerCase();
      const lead = leads.find(l => l.leadId === meeting.leadId);
      const orgName = lead ? lead.organisation || "" : "";
      const cleanOrg = orgName.toLowerCase().replace(/\s+/g, "");
      const cleanPurpose = (meeting.purpose || "").toLowerCase().replace(/\s+/g, "");
      const cleanOwner = (getUserDisplayName(meeting.owner) || "").toLowerCase().replace(/\s+/g, "");
      const cleanNotes = (meeting.notes || "").toLowerCase().replace(/\s+/g, "");
      return cleanOrg.includes(cleanSearchVal) || 
             cleanPurpose.includes(cleanSearchVal) ||
             cleanOwner.includes(cleanSearchVal) ||
             cleanNotes.includes(cleanSearchVal);
    });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:32px 0;">No meetings found. Tap the '+' button to log.</div>`;
    return;
  }

  filtered.forEach(meeting => {
    const lead = leads.find(l => l.leadId === meeting.leadId);
    const orgName = lead ? lead.organisation : "Unknown Hospital";

    const card = document.createElement("div");
    card.className = "record-card glass";
    card.onclick = () => showMeetingDetail(meeting.meetingId);

    card.innerHTML = `
      <div class="record-header">
        <div class="record-title">${orgName}</div>
        <div class="record-badge badge-qualified">${meeting.purpose}</div>
      </div>
      <div class="record-details" style="grid-template-columns: 1fr;">
        <div class="record-detail-item" style="font-weight: 500;">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"></path></svg>
          <span>GPS: ${meeting.gps || "Not Captured"}</span>
        </div>
        <div class="record-detail-item">
          <span>Notes: ${(meeting.notes || "").substring(0, 50)}...</span>
        </div>
      </div>
      <div class="record-footer">
        <div class="record-owner">
          <div class="record-owner-avatar">${getUserDisplayName(meeting.owner)[0] || "U"}</div>
          <span>${getUserDisplayName(meeting.owner)}</span>
        </div>
        <div class="record-time">
          ${meeting.date}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- FORM ENGINE (DYNAMIC RENDERING) ---
function openAddLeadSheet() {
  showSheet("leadFormSheet");
}

function openAddMeetingSheet() {
  showSheet("meetingFormSheet");
}

function populateLeadFormForAdd(defaultStatus = null) {
  selectedLead = null;
  document.getElementById("leadSheetTitle").innerText = "Add New Lead";
  document.getElementById("leadFormSubmitBtn").innerText = "Save Lead";
  document.getElementById("leadDeleteBtn").style.display = "none";
  
  // Clear core inputs
  document.getElementById("leadOrg").value = "";
  document.getElementById("leadPoc1Name").value = "";
  document.getElementById("leadPoc1Phone").value = "";
  document.getElementById("leadPoc1Specialization").value = "";
  document.getElementById("leadPoc2Name").value = "";
  document.getElementById("leadPoc2Phone").value = "";
  document.getElementById("leadPoc2Specialization").value = "";
  document.getElementById("leadPoc3Name").value = "";
  document.getElementById("leadPoc3Phone").value = "";
  document.getElementById("leadPoc3Specialization").value = "";
  document.getElementById("leadRevenue").value = "";
  document.getElementById("leadFollowup").value = "";
  document.getElementById("leadGps").value = "";
  document.getElementById("leadGpsCoordsDisplay").innerText = "Tap button below to capture";
  
  // Show only POC 1 by default on add form
  document.getElementById("leadPoc2").style.display = "none";
  document.getElementById("leadPoc3").style.display = "none";
  document.getElementById("addMoreContactContainer").style.display = "block";
  
  // Populate dropdowns from dynamic configuration
  populateDropdown("leadAudience", db.getConfig().audienceTypes);
  populateDropdown("leadStatus", db.getConfig().leadStatuses);
  
  if (defaultStatus) {
    document.getElementById("leadStatus").value = defaultStatus;
  } else {
    const statuses = db.getConfig().leadStatuses;
    if (statuses && statuses.length > 0) {
      document.getElementById("leadStatus").value = statuses[0];
    }
  }

  populateDropdown("leadLostReason", db.getConfig().nonConversionReasons, true);

  // Toggle reasons box when status changes
  toggleLostReasonsBox();

  // Render custom fields
  renderDynamicCustomFields("leadCustomFieldsContainer", "lead");
}

function populateLeadFormForEdit(lead) {
  if (!lead) return;
  document.getElementById("leadSheetTitle").innerText = "Edit Lead Details";
  document.getElementById("leadFormSubmitBtn").innerText = "Update Lead";
  
  // Reps/Managers can archive/delete if authorized
  if (currentUser.role === "Admin" || currentUser.role === "Manager") {
    document.getElementById("leadDeleteBtn").style.display = "block";
  } else {
    document.getElementById("leadDeleteBtn").style.display = "none";
  }

  document.getElementById("leadOrg").value = lead.organisation;
  document.getElementById("leadPoc1Name").value = lead.poc1Name || "";
  document.getElementById("leadPoc1Phone").value = lead.poc1Phone || "";
  document.getElementById("leadPoc1Specialization").value = lead.poc1Specialization || "";
  document.getElementById("leadPoc2Name").value = lead.poc2Name || "";
  document.getElementById("leadPoc2Phone").value = lead.poc2Phone || "";
  document.getElementById("leadPoc2Specialization").value = lead.poc2Specialization || "";
  
  document.getElementById("leadPoc3Name").value = lead.customFields?.poc3Name || "";
  document.getElementById("leadPoc3Phone").value = lead.customFields?.poc3Phone || "";
  document.getElementById("leadPoc3Specialization").value = lead.customFields?.poc3Specialization || "";

  document.getElementById("leadRevenue").value = lead.revenuePotential;
  document.getElementById("leadFollowup").value = lead.followup || "";
  document.getElementById("leadGps").value = lead.gps || "";
  document.getElementById("leadGpsCoordsDisplay").innerText = lead.gps ? `Captured: ${lead.gps}` : "Coordinates not captured";

  // Handle show/hide of contacts depending on if data exists
  const hasPoc2 = lead.poc2Name || lead.poc2Phone || lead.poc2Specialization;
  const hasPoc3 = lead.customFields?.poc3Name || lead.customFields?.poc3Phone || lead.customFields?.poc3Specialization;

  if (hasPoc3) {
    document.getElementById("leadPoc2").style.display = "block";
    document.getElementById("leadPoc3").style.display = "block";
    document.getElementById("addMoreContactContainer").style.display = "none";
  } else if (hasPoc2) {
    document.getElementById("leadPoc2").style.display = "block";
    document.getElementById("leadPoc3").style.display = "none";
    document.getElementById("addMoreContactContainer").style.display = "block";
  } else {
    document.getElementById("leadPoc2").style.display = "none";
    document.getElementById("leadPoc3").style.display = "none";
    document.getElementById("addMoreContactContainer").style.display = "block";
  }

  populateDropdown("leadAudience", db.getConfig().audienceTypes);
  document.getElementById("leadAudience").value = lead.audienceType;

  populateDropdown("leadStatus", db.getConfig().leadStatuses);
  document.getElementById("leadStatus").value = lead.status;

  populateDropdown("leadLostReason", db.getConfig().nonConversionReasons, true);
  
  toggleLostReasonsBox();
  if (lead.status === "Lost") {
    document.getElementById("leadLostReason").value = lead.nonConversionReason || "";
    document.getElementById("leadLostAction").value = lead.nonConversionAction || "";
  }

  // Set custom fields values
  renderDynamicCustomFields("leadCustomFieldsContainer", "lead");
  const registeredFields = db.getFormFields().filter(f => f.target === "lead" && f.active);
  registeredFields.forEach(f => {
    const input = document.getElementById(`custom_${f.id}`);
    if (input) {
      if (f.type === "checkbox") {
        input.checked = lead.customFields?.[f.id] || false;
      } else if (f.type === "radio") {
        const val = lead.customFields?.[f.id] || "";
        const radio = input.querySelector(`input[value="${val}"]`);
        if (radio) radio.checked = true;
      } else {
        input.value = lead.customFields?.[f.id] || "";
      }
    }
  });
}

function addMoreContact() {
  const poc2 = document.getElementById("leadPoc2");
  const poc3 = document.getElementById("leadPoc3");
  const btnContainer = document.getElementById("addMoreContactContainer");
  
  if (poc2.style.display === "none" || !poc2.style.display) {
    poc2.style.display = "block";
  } else if (poc3.style.display === "none" || !poc3.style.display) {
    poc3.style.display = "block";
    btnContainer.style.display = "none";
  }
}

function populateMeetingForm(preselectedLeadId = null) {
  applyStandardFieldsConfig();
  document.getElementById("meetingSheetTitle").innerText = "Log Client Meeting";
  
  // Populate Leads Dropdown
  const leadsDropdown = document.getElementById("meetingLeadId");
  leadsDropdown.innerHTML = "";
  const leads = db.getLeads().filter(l => currentUser.role === "Rep" ? l.owner === currentUser.name : true);
  leads.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.leadId;
    opt.innerText = l.organisation;
    if (preselectedLeadId && l.leadId === preselectedLeadId) {
      opt.selected = true;
    }
    leadsDropdown.appendChild(opt);
  });

  // Populate config dropdowns
  populateDropdown("meetingPurpose", db.getConfig().meetingPurposes);
  populateDropdown("meetingOutcome", db.getConfig().meetingOutcomes);
  
  // Clear fields
  document.getElementById("meetingNotes").value = "";
  document.getElementById("meetingDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("meetingFollowup").value = "";
  document.getElementById("meetingGps").value = "";
  document.getElementById("gpsCoordsDisplay").innerText = "Tap button below to capture";
  
  // Photo reset
  photoPreviewBase64 = null;
  const imgPreview = document.getElementById("photoCapturePreview");
  imgPreview.src = "";
  imgPreview.style.display = "none";

  // Dynamic custom fields
  renderDynamicCustomFields("meetingCustomFieldsContainer", "meeting");
}

function populateDropdown(elId, list, addEmpty = false) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  if (addEmpty) {
    el.innerHTML = `<option value="">-- Choose Reason (if Lost) --</option>`;
  }
  list.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.innerText = val;
    el.appendChild(opt);
  });
}

function toggleLostReasonsBox() {
  const status = document.getElementById("leadStatus").value;
  const lostBox = document.getElementById("lostReasonSection");
  if (status === "Lost") {
    lostBox.style.display = "block";
    document.getElementById("leadLostReason").setAttribute("required", "true");
  } else {
    lostBox.style.display = "none";
    document.getElementById("leadLostReason").removeAttribute("required");
  }
}

// Render dynamic custom inputs configured by Admin
function renderDynamicCustomFields(containerId, target) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const fields = db.getFormFields().filter(f => f.active && f.target === target);

  fields.forEach(field => {
    const group = document.createElement("div");
    group.className = "form-group";

    const label = document.createElement("label");
    label.className = `form-label ${field.mandatory ? "required" : ""}`;
    label.innerText = field.label;
    group.appendChild(label);

    let input;
    if (field.type === "dropdown") {
      input = document.createElement("select");
      input.className = "form-control dynamic-field";
      input.id = `custom_${field.id}`;
      if (field.mandatory) input.required = true;
      
      input.innerHTML = `<option value="">-- Select Option --</option>`;
      field.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.innerText = opt;
        input.appendChild(o);
      });
    } else if (field.type === "radio") {
      const radioContainer = document.createElement("div");
      radioContainer.className = "dynamic-field-radio-group dynamic-field";
      radioContainer.id = `custom_${field.id}`;
      radioContainer.style.display = "flex";
      radioContainer.style.flexWrap = "wrap";
      radioContainer.style.gap = "16px";
      radioContainer.style.marginTop = "6px";
      
      field.options.forEach((opt, oIdx) => {
        const rLabel = document.createElement("label");
        rLabel.className = "form-checkbox";
        rLabel.style.margin = "0";
        rLabel.style.cursor = "pointer";
        
        const rInput = document.createElement("input");
        rInput.type = "radio";
        rInput.name = `custom_radio_${field.id}`;
        rInput.value = opt;
        if (field.mandatory && oIdx === 0) rInput.required = true;
        
        const rText = document.createElement("span");
        rText.innerText = opt;
        
        rLabel.appendChild(rInput);
        rLabel.appendChild(rText);
        radioContainer.appendChild(rLabel);
      });
      group.appendChild(radioContainer);
      container.appendChild(group);
      return;
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "form-control dynamic-field";
      input.id = `custom_${field.id}`;
      if (field.mandatory) input.required = true;
    } else if (field.type === "checkbox") {
      group.className = "form-checkbox";
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "dynamic-field";
      input.id = `custom_${field.id}`;
      label.className = "";
      label.prepend(input);
      // swap children to make label appear after checkbox
      group.appendChild(label);
      container.appendChild(group);
      return;
    } else {
      input = document.createElement("input");
      input.type = field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text";
      input.className = "form-control dynamic-field";
      input.id = `custom_${field.id}`;
      if (field.mandatory) input.required = true;
    }

    group.appendChild(input);
    container.appendChild(group);
  });
}

function collectDynamicFields(containerId) {
  const customFieldsData = {};
  const container = document.getElementById(containerId);
  if (!container) return customFieldsData;
  
  const dynamicInputs = container.querySelectorAll(".dynamic-field");
  dynamicInputs.forEach(input => {
    const fid = input.id.replace("custom_", "");
    if (input.classList.contains("dynamic-field-radio-group")) {
      const checkedRadio = input.querySelector('input[type="radio"]:checked');
      customFieldsData[fid] = checkedRadio ? checkedRadio.value : "";
    } else {
      customFieldsData[fid] = input.type === "checkbox" ? input.checked : input.value;
    }
  });
  return customFieldsData;
}

// Save Lead Form Submit
function submitLeadForm(e) {
  e.preventDefault();
  
  const poc1Name = document.getElementById("leadPoc1Name").value.trim();
  const poc1Phone = document.getElementById("leadPoc1Phone").value.trim();
  const poc1Specialization = document.getElementById("leadPoc1Specialization").value.trim();
  
  const poc2Name = document.getElementById("leadPoc2Name").value.trim();
  const poc2Phone = document.getElementById("leadPoc2Phone").value.trim();
  const poc2Specialization = document.getElementById("leadPoc2Specialization").value.trim();

  const poc3Name = document.getElementById("leadPoc3Name") ? document.getElementById("leadPoc3Name").value.trim() : "";
  const poc3Phone = document.getElementById("leadPoc3Phone") ? document.getElementById("leadPoc3Phone").value.trim() : "";
  const poc3Specialization = document.getElementById("leadPoc3Specialization") ? document.getElementById("leadPoc3Specialization").value.trim() : "";

  // Combine into poc1/poc2/poc3 strings for backward compatibility
  const poc1 = poc1Name + (poc1Phone ? ` (${poc1Phone})` : "") + (poc1Specialization ? ` - ${poc1Specialization}` : "");
  const poc2 = poc2Name + (poc2Phone ? ` (${poc2Phone})` : "") + (poc2Specialization ? ` - ${poc2Specialization}` : "");
  const poc3 = poc3Name + (poc3Phone ? ` (${poc3Phone})` : "") + (poc3Specialization ? ` - ${poc3Specialization}` : "");

  const leadId = selectedLead ? selectedLead.leadId : "L-" + Math.floor(Math.random() * 9000 + 1000);
  const status = document.getElementById("leadStatus").value;

  const customFieldsData = collectDynamicFields("leadCustomFieldsContainer");

  // Record edit logs inside Lead Custom Fields edits
  const edits = selectedLead && selectedLead.customFields && selectedLead.customFields.edits ? [...selectedLead.customFields.edits] : [];
  const actionText = selectedLead ? `Lead details updated (Status: ${status})` : `Lead created (Status: ${status})`;
  edits.push({
    timestamp: new Date().toISOString(),
    user: currentUser.name,
    action: actionText
  });
  customFieldsData.edits = edits;

  // Store POC 3 inside custom fields data
  customFieldsData.poc3Name = poc3Name;
  customFieldsData.poc3Phone = poc3Phone;
  customFieldsData.poc3Specialization = poc3Specialization;
  customFieldsData.poc3 = poc3;

  const leadData = {
    leadId,
    organisation: document.getElementById("leadOrg").value,
    poc1Name,
    poc1Phone,
    poc1Specialization,
    poc2Name,
    poc2Phone,
    poc2Specialization,
    poc1,
    poc2,
    audienceType: document.getElementById("leadAudience").value,
    owner: selectedLead ? selectedLead.owner : currentUser.id,
    gps: document.getElementById("leadGps").value,
    status,
    followup: document.getElementById("leadFollowup").value,
    revenuePotential: parseFloat(document.getElementById("leadRevenue").value) || 0,
    nonConversionReason: status === "Lost" ? document.getElementById("leadLostReason").value : "",
    nonConversionAction: status === "Lost" ? document.getElementById("leadLostAction").value : "",
    createdAt: selectedLead ? selectedLead.createdAt : new Date().toISOString(),
    archived: false,
    customFields: customFieldsData
  };

  db.saveLead(leadData);
  showToast(selectedLead ? "Lead details updated!" : "New referral lead added successfully!", "success");
  closeSheet("leadFormSheet");
  triggerSync(true); // Sync lead creation/update immediately
  renderLeadsList();
  renderDashboard();
}

// Save Meeting Form Submit
function submitMeetingForm(e) {
  e.preventDefault();

  const customFieldsData = collectDynamicFields("meetingCustomFieldsContainer");

  const meetingData = {
    meetingId: "M-" + Math.floor(Math.random() * 9000 + 1000),
    leadId: document.getElementById("meetingLeadId").value,
    purpose: document.getElementById("meetingPurpose").value,
    notes: document.getElementById("meetingNotes").value,
    outcome: document.getElementById("meetingOutcome").value,
    owner: currentUser.id,
    gps: document.getElementById("meetingGps").value,
    date: document.getElementById("meetingDate").value,
    followup: document.getElementById("meetingFollowup").value,
    createdAt: new Date().toISOString(),
    archived: false,
    customFields: customFieldsData,
    photo: photoPreviewBase64
  };

  db.saveMeeting(meetingData);

  // Update linked Lead status automatically to match meeting outcome
  const leads = db.getLeads();
  const linkedLead = leads.find(l => l.leadId === meetingData.leadId);
  if (linkedLead) {
    if (meetingData.outcome === "Referral Started" || meetingData.outcome === "Proposal Submitted") {
      linkedLead.status = "Referral Started";
      linkedLead.followup = meetingData.followup || linkedLead.followup;
      db.saveLead(linkedLead);
    } else if (meetingData.outcome === "Lost Opportunity") {
      linkedLead.status = "Lost";
      linkedLead.nonConversionReason = "Doctor aligned elsewhere";
      linkedLead.nonConversionAction = "Refollow and analyze service gaps";
      db.saveLead(linkedLead);
    }
  }

  showToast("Meeting successfully added!", "success");
  closeSheet("meetingFormSheet");
  triggerSync(true);
  renderMeetingsList();
  renderDashboard();
}

// Reverse Geocoding via OpenStreetMap Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { "Accept-Language": "en" }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      // Get city or village name only (checking village, town, city, suburb, neighbourhood, county)
      return addr.village || addr.town || addr.city || addr.suburb || addr.neighbourhood || addr.county || addr.city_district || null;
    }
  } catch (err) {
    console.error("Reverse geocoding error: ", err);
  }
  return null;
}

// Geolocation simulator
function captureGps() {
  const display = document.getElementById("gpsCoordsDisplay");
  const input = document.getElementById("meetingGps");

  display.innerText = "Accessing GPS...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        
        display.innerText = `Captured: ${lat}, ${lng}. Resolving city name...`;
        
        let displayVal = `${lat}, ${lng}`;
        if (navigator.onLine) {
          const place = await reverseGeocode(lat, lng);
          if (place) displayVal = `${lat}, ${lng} (${place})`;
        }
        
        input.value = displayVal;
        display.innerText = `GPS Location: ${displayVal} (Accuracy: ${pos.coords.accuracy.toFixed(1)}m)`;
        showToast("GPS location secured!", "info");
      },
      async (err) => {
        // Fallback for demo simulation (since GitHub Pages / local file might block GPS)
        const simLat = (23.33 + (Math.random() - 0.5) * 0.05).toFixed(5);
        const simLng = (75.03 + (Math.random() - 0.5) * 0.05).toFixed(5);
        
        display.innerText = `Simulating GPS: ${simLat}, ${simLng}. Resolving city name...`;
        
        let displayVal = `${simLat}, ${simLng}`;
        if (navigator.onLine) {
          const place = await reverseGeocode(simLat, simLng);
          if (place) displayVal = `${simLat}, ${simLng} (${place})`;
        }
        
        input.value = displayVal;
        display.innerText = `Simulated GPS: ${displayVal} (Local permission fallback)`;
        showToast("Simulated GPS captured", "warning");
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  } else {
    display.innerText = "GPS Not supported on this device";
  }
}

function captureLeadGps() {
  const display = document.getElementById("leadGpsCoordsDisplay");
  const input = document.getElementById("leadGps");

  display.innerText = "Accessing GPS...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        
        display.innerText = `Captured: ${lat}, ${lng}. Resolving city name...`;
        
        let displayVal = `${lat}, ${lng}`;
        if (navigator.onLine) {
          const place = await reverseGeocode(lat, lng);
          if (place) displayVal = `${lat}, ${lng} (${place})`;
        }
        
        input.value = displayVal;
        display.innerText = `GPS Location: ${displayVal} (Accuracy: ${pos.coords.accuracy.toFixed(1)}m)`;
        showToast("GPS location secured!", "info");
      },
      async (err) => {
        // Fallback for demo simulation (since GitHub Pages / local file might block GPS)
        const simLat = (23.33 + (Math.random() - 0.5) * 0.05).toFixed(5);
        const simLng = (75.03 + (Math.random() - 0.5) * 0.05).toFixed(5);
        
        display.innerText = `Simulating GPS: ${simLat}, ${simLng}. Resolving city name...`;
        
        let displayVal = `${simLat}, ${simLng}`;
        if (navigator.onLine) {
          const place = await reverseGeocode(simLat, simLng);
          if (place) displayVal = `${simLat}, ${simLng} (${place})`;
        }
        
        input.value = displayVal;
        display.innerText = `Simulated GPS: ${displayVal} (Local permission fallback)`;
        showToast("Simulated GPS captured", "warning");
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  } else {
    display.innerText = "GPS Not supported on this device";
  }
}

// Photo Upload Simulator
function triggerPhotoCapture() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.capture = "environment"; // Trigger back camera on mobile
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        photoPreviewBase64 = event.target.result;
        const img = document.getElementById("photoCapturePreview");
        img.src = photoPreviewBase64;
        img.style.display = "block";
        showToast("Image captured and attached!", "info");
      };
      reader.readAsDataURL(file);
    }
  };
  fileInput.click();
}

// --- DETAILS VIEWS ---
function showLeadDetail(id) {
  showSheet("leadDetailSheet", { id });
}

function renderLeadDetail(id) {
  const lead = db.getLeads().find(l => l.leadId === id);
  if (!lead) return;

  selectedLead = lead;

  const status = lead.status || "Contacted";
  document.getElementById("detailOrg").innerText = lead.organisation || "Unnamed Organisation";
  document.getElementById("detailStatus").innerText = status;
  document.getElementById("detailStatus").className = `record-badge badge-${status.toLowerCase().replace(" ", "-")}`;

  document.getElementById("detailAudience").innerText = lead.audienceType || "-";
  document.getElementById("detailOwner").innerText = getUserDisplayName(lead.owner) || "-";
  
  // Display structured POC details
  document.getElementById("detailPoc1Name").innerText = lead.poc1Name || "-";
  document.getElementById("detailPoc1Phone").innerText = lead.poc1Phone || "-";
  document.getElementById("detailPoc1Spec").innerText = lead.poc1Specialization || "-";
  
  const hasPoc2 = lead.poc2Name || lead.poc2Phone || lead.poc2Specialization;
  const wrapper2 = document.getElementById("detailPoc2Wrapper");
  if (wrapper2) {
    if (hasPoc2) {
      wrapper2.style.display = "";
      document.getElementById("detailPoc2Name").innerText = lead.poc2Name || "-";
      document.getElementById("detailPoc2Phone").innerText = lead.poc2Phone || "-";
      document.getElementById("detailPoc2Spec").innerText = lead.poc2Specialization || "-";
    } else {
      wrapper2.style.display = "none";
    }
  }

  const poc3Name = lead.customFields?.poc3Name || "";
  const poc3Phone = lead.customFields?.poc3Phone || "";
  const poc3Spec = lead.customFields?.poc3Specialization || "";
  const hasPoc3 = poc3Name || poc3Phone || poc3Spec;
  const wrapper3 = document.getElementById("detailPoc3Wrapper");
  if (wrapper3) {
    if (hasPoc3) {
      wrapper3.style.display = "";
      document.getElementById("detailPoc3Name").innerText = poc3Name || "-";
      document.getElementById("detailPoc3Phone").innerText = poc3Phone || "-";
      document.getElementById("detailPoc3Spec").innerText = poc3Spec || "-";
    } else {
      wrapper3.style.display = "none";
    }
  }

  document.getElementById("detailGps").innerText = lead.gps || "None Captured";
  document.getElementById("detailFollowup").innerText = lead.followup || "None Scheduled";
  document.getElementById("detailRevenue").innerText = `₹${lead.revenuePotential.toLocaleString()}`;

  // Custom Fields render (except edits system field)
  const customList = document.getElementById("detailCustomFields");
  customList.innerHTML = "";
  const registeredFields = db.getFormFields().filter(f => f.target === "lead");
  
  registeredFields.forEach(f => {
    if (f.id === "edits") return;
    const val = lead.customFields?.[f.id] ?? "-";
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.padding = "6px 0";
    li.style.borderBottom = "1px solid var(--bg-app)";
    li.style.fontSize = "0.85rem";
    li.innerHTML = `<span style="color:var(--text-muted);">${f.label}:</span> <span style="font-weight:600;">${val}</span>`;
    customList.appendChild(li);
  });

  // Combined History Timeline (Meetings, Referrals, and Edits)
  const timeline = document.getElementById("detailTimeline");
  timeline.innerHTML = "";
  const leadMeetings = db.getMeetings().filter(m => m.leadId === id);
  const leadReferrals = db.getReferrals().filter(r => r.leadId === id);
  const edits = lead.customFields?.edits || [];

  const events = [];

  leadMeetings.forEach(m => {
    events.push({
      timestamp: m.createdAt || m.date,
      html: `
        <div style="font-weight:600; color:var(--info);">[Meeting] ${m.purpose} - ${m.outcome}</div>
        <div style="color:var(--text-muted); font-size:0.75rem;">Logged by ${m.owner} on ${m.date || m.createdAt.substring(0, 10)}</div>
        <div style="margin-top:4px; font-style:italic;">"${m.notes}"</div>
      `
    });
  });

  leadReferrals.forEach(r => {
    events.push({
      timestamp: r.createdAt,
      html: `
        <div style="font-weight:600; color:var(--warning);">[Referral] Patient: ${r.patientName} (${r.reached || 'Pending'})</div>
        <div style="color:var(--text-muted); font-size:0.75rem;">Created by ${r.owner} for expected visit on ${r.visitDate}</div>
        ${r.reached === 'Yes' ? `<div style="font-size:0.8rem; margin-top:2px; color:var(--success);">Reached! Admission ID: ${r.admissionId || '-'}</div>` : ''}
        ${r.remarks ? `<div style="margin-top:4px; font-style:italic;">"${r.remarks}"</div>` : ''}
      `
    });
  });

  edits.forEach(e => {
    events.push({
      timestamp: e.timestamp,
      html: `
        <div style="font-weight:600; color:var(--success);">[Edit] ${e.action}</div>
        <div style="color:var(--text-muted); font-size:0.75rem;">Updated by ${e.user} on ${new Date(e.timestamp).toLocaleDateString()} ${new Date(e.timestamp).toLocaleTimeString()}</div>
      `
    });
  });

  // Sort chronologically (newest first)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (events.length === 0) {
    timeline.innerHTML = `<li style="font-size:0.85rem; color:var(--text-muted)">No activities logged for this lead yet.</li>`;
  } else {
    events.forEach(event => {
      const li = document.createElement("li");
      li.style.padding = "8px 0";
      li.style.fontSize = "0.85rem";
      li.style.borderBottom = "1px dotted var(--bg-app)";
      li.innerHTML = event.html;
      timeline.appendChild(li);
    });
  }

  // Edit controls display based on roles
  const editBtn = document.getElementById("leadDetailEditBtn");
  if (currentUser.role === "Rep" && lead.owner !== currentUser.id) {
    editBtn.style.display = "none";
  } else {
    editBtn.style.display = "block";
  }
}

function editSelectedLead() {
  if (!selectedLead) return;
  showSheet("leadFormSheet", { id: selectedLead.leadId });
}

function archiveSelectedLead() {
  if (!selectedLead) return;
  if (confirm("Are you sure you want to archive/remove this lead? This will remove it from active tracking.")) {
    const leads = db.get("leads");
    const idx = leads.findIndex(l => l.leadId === selectedLead.leadId);
    if (idx !== -1) {
      leads[idx].archived = true;
      db.set("leads", leads);
      showToast("Lead archived successfully", "info");
      closeSheet("leadFormSheet");
      triggerSync(true); // Sync archive immediately
      renderLeadsList();
      renderDashboard();
    }
  }
}

function showMeetingDetail(id) {
  showSheet("meetingDetailSheet", { id });
}

function renderMeetingDetail(id) {
  const meeting = db.getMeetings().find(m => m.meetingId === id);
  if (!meeting) return;

  const leads = db.getLeads();
  const lead = leads.find(l => l.leadId === meeting.leadId);

  document.getElementById("detailMeetingOrg").innerText = lead ? lead.organisation : "Unknown Hospital";
  document.getElementById("detailMeetingPurpose").innerText = meeting.purpose;
  document.getElementById("detailMeetingDate").innerText = meeting.date;
  document.getElementById("detailMeetingOutcome").innerText = meeting.outcome;
  document.getElementById("detailMeetingGps").innerText = meeting.gps || "None Recorded";
  document.getElementById("detailMeetingNotes").innerText = meeting.notes;
  document.getElementById("detailMeetingOwner").innerText = getUserDisplayName(meeting.owner);

  // Custom Fields render
  const customList = document.getElementById("detailMeetingCustomFields");
  if (customList) {
    customList.innerHTML = "";
    const registeredFields = db.getFormFields().filter(f => f.target === "meeting");
    
    registeredFields.forEach(f => {
      const val = meeting.customFields?.[f.id] ?? "-";
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.padding = "6px 0";
      li.style.borderBottom = "1px solid var(--bg-app)";
      li.style.fontSize = "0.85rem";
      li.innerHTML = `<span style="color:var(--text-muted);">${f.label}:</span> <span style="font-weight:600;">${val}</span>`;
      customList.appendChild(li);
    });
  }

  // Custom photo
  const photoContainer = document.getElementById("detailMeetingPhotoContainer");
  if (meeting.photo) {
    photoContainer.innerHTML = `<img src="${meeting.photo}" alt="Meeting Proof" style="max-width:100%; border-radius:8px; margin-top:8px; box-shadow:var(--shadow-sm);">`;
  } else {
    photoContainer.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">No photo proof attached</span>`;
  }
}

// --- ANALYTICS REPORTS ---
function shareLeadAsImage() {
  if (!selectedLead) {
    showToast("No lead selected to share", "error");
    return;
  }

  const settings = db.getShareSettings();

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");

  // 1. Draw premium background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
  bgGrad.addColorStop(0, "#0b2530"); // Dark primary color
  bgGrad.addColorStop(1, "#111827"); // Deep slate
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 500);

  // 2. Add accent glowing lines or shapes
  const accentGrad = ctx.createLinearGradient(0, 0, 800, 0);
  accentGrad.addColorStop(0, "#10b981"); // Success green
  accentGrad.addColorStop(0.5, "#1b7a9c"); // Primary light
  accentGrad.addColorStop(1, "#8b5cf6"); // Info purple
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, 800, 8); // Top thick glowing border

  // Draw logo placeholder/branding
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("RATLAM HOSPITAL", 50, 48);

  ctx.fillStyle = "#8b5cf6";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("REFERRAL PARTNER NETWORK", 50, 68);

  // Draw horizontal separator
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 85);
  ctx.lineTo(750, 85);
  ctx.stroke();

  // 3. Organization Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(selectedLead.organisation, 50, 135);

  // Status Badge Pill
  if (settings.showStatus) {
    const status = selectedLead.status;
    let badgeColor = "#64748b"; // muted
    let badgeBg = "rgba(100, 116, 139, 0.2)";
    if (status === "Converted") {
      badgeColor = "#10b981";
      badgeBg = "rgba(16, 185, 129, 0.2)";
    } else if (status === "Referral Started" || status === "Qualified") {
      badgeColor = "#f59e0b";
      badgeBg = "rgba(245, 158, 11, 0.2)";
    } else if (status === "Lost") {
      badgeColor = "#ef4444";
      badgeBg = "rgba(239, 68, 68, 0.2)";
    }
    
    // Draw Status Badge background
    ctx.fillStyle = badgeBg;
    ctx.font = "bold 13px sans-serif";
    const statusWidth = ctx.measureText(status).width + 24;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(50, 160, statusWidth, 30, 15);
      ctx.fill();
    } else {
      ctx.fillRect(50, 160, statusWidth, 30);
    }
    
    // Draw Status Badge text
    ctx.fillStyle = badgeColor;
    ctx.fillText(status, 62, 180);
  }

  // 4. Draw lead details dynamically
  let leftY = 230;
  if (settings.showPoc1) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("PRIMARY CONTACT (POC)", 50, leftY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 17px sans-serif";
    ctx.fillText(selectedLead.poc1 || "-", 50, leftY + 22);
    leftY += 65;
  }

  if (settings.showOwner) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("REP AGENT OWNER", 50, leftY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 17px sans-serif";
    ctx.fillText(getUserDisplayName(selectedLead.owner) || "-", 50, leftY + 22);
    leftY += 65;
  }

  if (settings.showRevenue) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("ESTIMATED MONTHLY REFERRALS", 50, leftY);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`₹${(selectedLead.revenuePotential || 0).toLocaleString()}`, 50, leftY + 28);
    leftY += 75;
  }

  // 5. Draw right-side summary card
  const metaItems = [];
  if (settings.showLeadId) {
    metaItems.push({ label: "Establishment ID:", val: selectedLead.leadId || "-" });
  }
  if (settings.showAudience) {
    metaItems.push({ label: "Audience Type:", val: selectedLead.audienceType || "-" });
  }
  if (settings.showFollowup) {
    metaItems.push({ label: "Next Followup:", val: selectedLead.followup || "None Scheduled", color: "#f59e0b" });
  }
  if (settings.showSpeciality) {
    metaItems.push({ label: "Speciality:", val: selectedLead.customFields?.speciality || "-" });
  }

  if (metaItems.length > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    const boxHeight = 45 + (metaItems.length * 52);
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(460, 115, 290, boxHeight, 16);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(460, 115, 290, boxHeight);
      ctx.strokeRect(460, 115, 290, boxHeight);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Lead Metadata", 485, 148);

    let metaY = 182;
    metaItems.forEach(item => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "500 12px sans-serif";
      ctx.fillText(item.label, 485, metaY);
      
      ctx.fillStyle = item.color || "#ffffff";
      ctx.font = "600 13px sans-serif";
      ctx.fillText(item.val, 485, metaY + 18);
      metaY += 52;
    });
  }

  // Footer branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "500 11px sans-serif";
  const now = new Date();
  ctx.fillText(`Generated on ${now.toLocaleString()}`, 50, 470);
  ctx.fillText("Confidential CRM Record", 610, 470);

  // Parse share caption text
  const leadLink = window.location.origin + window.location.pathname + `#/leads?id=${selectedLead.leadId}`;
  let caption = settings.captionText || "Check out the details for referral lead: {organisation}";
  caption = caption
    .replace(/{organisation}/g, selectedLead.organisation)
    .replace(/{poc1}/g, selectedLead.poc1 || "")
    .replace(/{status}/g, selectedLead.status || "")
    .replace(/{owner}/g, getUserDisplayName(selectedLead.owner) || "")
    .replace(/{leadId}/g, selectedLead.leadId || "")
    .replace(/{link}/g, leadLink);

  if (!caption.includes(leadLink)) {
    caption += `\nOpen Lead: ${leadLink}`;
  }

  // Perform sharing or fallback
  canvas.toBlob(blob => {
    const file = new File([blob], `${selectedLead.organisation.replace(/\s+/g, '_')}_lead_card.png`, { type: "image/png" });
    
    // Check if navigator.share supports file sharing
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: `${selectedLead.organisation} CRM Card`,
        text: caption
      }).catch(err => {
        console.warn("Share failed, falling back to download", err);
        triggerDownload(canvas);
      });
    } else {
      triggerDownload(canvas);
    }
  }, "image/png");
}

function triggerDownload(canvas) {
  const link = document.createElement("a");
  link.download = `${selectedLead.organisation.replace(/\s+/g, '_')}_lead_card.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("Lead card image downloaded!", "success");
}

function logMeetingForLeadShortcut() {
  if (!selectedLead) return;
  const leadId = selectedLead.leadId;
  showSheet("meetingFormSheet", { leadId });
}

function matchTimeframe(dateStr) {
  return matchDashboardTimeframe(dateStr);
}

// --- NEW REFERRALS MODULE LOGIC ---
let activeReferralFilter = "all";

function setReferralFilter(filter, btn) {
  activeReferralFilter = filter;
  document.querySelectorAll(".referral-filter-btn").forEach(el => el.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderReferralsList();
}

function renderReferralsList() {
  const referrals = db.getReferrals();
  const leads = db.getLeads();
  const searchVal = (document.getElementById("referralsSearchInput")?.value || "").replace(/\s+/g, "").toLowerCase();
  
  const ownerFilter = (r) => currentUser.role === "Rep" ? r.owner === currentUser.id : true;
  const container = document.getElementById("referralsListContainer");
  if (!container) return;
  container.innerHTML = "";
  
  const filtered = referrals
    .filter(ownerFilter)
    .filter(r => {
      const lead = leads.find(l => l.leadId === r.leadId);
      const leadName = lead ? lead.organisation || "Unknown Lead" : "Unknown Lead";
      
      const cleanName = (r.patientName || "").toLowerCase().replace(/\s+/g, "");
      const cleanPhone = (r.patientPhone || "").replace(/\s+/g, "");
      const cleanLeadName = leadName.toLowerCase().replace(/\s+/g, "");
      
      const matchSearch = cleanName.includes(searchVal) || 
                          cleanPhone.includes(searchVal) || 
                          cleanLeadName.includes(searchVal);
                          
      let matchStatus = true;
      if (activeReferralFilter === "reached") {
        matchStatus = r.reached === "Yes";
      } else if (activeReferralFilter === "pending") {
        matchStatus = r.reached === "Pending" || !r.reached;
      } else if (activeReferralFilter === "not_reached") {
        matchStatus = r.reached === "No";
      }
      
      return matchSearch && matchStatus;
    });
    
  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:32px 0;">No referrals found. Tap the '+' button to log a referral.</div>`;
    return;
  }
  
  filtered.forEach(r => {
    const lead = leads.find(l => l.leadId === r.leadId);
    const leadName = lead ? lead.organisation : "Unknown Lead";
    
    const card = document.createElement("div");
    card.className = "record-card glass";
    card.onclick = () => showReferralDetail(r.referralId);
    
    let statusClass = "badge-postponed"; // orange
    if (r.reached === "Yes") statusClass = "badge-converted"; // green
    if (r.reached === "No") statusClass = "badge-lost"; // red
    
    let detailsHtml = "";
    if (r.reached === "Yes") {
      const services = [];
      if (r.reachedDetails?.opd) services.push("OPD");
      if (r.reachedDetails?.ipd) services.push("IPD");
      if (r.reachedDetails?.investigations) services.push("Labs");
      if (r.reachedDetails?.medicines) services.push("Pharmacy");
      if (r.reachedDetails?.consultation) services.push("Consult");
      if (r.reachedDetails?.receptionEnquiry) services.push("Enquiry");
      
      detailsHtml = `
        <div style="grid-column: span 2; font-size:0.8rem; margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05); color:var(--success);">
          <strong>Services:</strong> ${services.join(", ") || "None"}
          ${r.admissionId ? `<br><strong>Adm ID:</strong> ${r.admissionId}` : ""}
        </div>
      `;
    } else if (r.reached === "No") {
      detailsHtml = `
        <div style="grid-column: span 2; font-size:0.8rem; margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05); color:var(--danger);">
          <strong>Reason:</strong> ${r.remarks || "No remark provided"}
        </div>
      `;
    } else {
      if (r.remarks) {
        detailsHtml = `
          <div style="grid-column: span 2; font-size:0.8rem; margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05); color:var(--text-muted);">
            <strong>Remark:</strong> ${r.remarks}
          </div>
        `;
      }
    }
    
    card.innerHTML = `
      <div class="record-header">
        <div class="record-title" style="font-size: 1.05rem; font-weight:700;">Patient: ${r.patientName}</div>
        <div class="record-badge ${statusClass}">${r.reached || "Pending"}</div>
      </div>
      <div class="record-details" style="margin-top: 10px; margin-bottom: 10px;">
        <div class="record-detail-item" style="grid-column: span 2;">
          <svg viewBox="0 0 24 24"><path d="M19 2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          <span style="font-weight:600; color:var(--primary);">${leadName}</span>
        </div>
        <div class="record-detail-item">
          <svg viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a1 1 0 0 0-1.01.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a1 1 0 0 0 .24-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4.03C3.47 3 3 3.47 3 4.02 3 13.39 10.61 21 19.98 21c.54 0 1-.46 1-1.02V16.38c0-.55-.45-1-1-1z"/></svg>
          <span>${r.patientPhone}</span>
        </div>
        <div class="record-detail-item">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Visit: ${r.visitDate}</span>
        </div>
        ${detailsHtml}
      </div>
      <div class="record-footer">
        <div class="record-owner">
          <div class="record-owner-avatar">${getUserDisplayName(r.owner)[0] || "U"}</div>
          <span>Logged by: ${getUserDisplayName(r.owner)}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function showReferralDetail(id) {
  showSheet("referralUpdateSheet", { id });
}

function populateReferralFormForAdd() {
  const select = document.getElementById("referralLeadId");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Hospital Lead --</option>';
  
  const leads = db.getLeads().filter(l => currentUser.role === "Rep" ? l.owner === currentUser.id : true);
  leads.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.leadId;
    opt.innerText = l.organisation;
    select.appendChild(opt);
  });
  
  document.getElementById("refPatientName").value = "";
  document.getElementById("refPatientPhone").value = "";
  document.getElementById("refVisitDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("refRemarks").value = "";
  
  // Render custom fields
  renderDynamicCustomFields("referralCustomFieldsContainer", "referral");
}

function setRefDateQuick(type) {
  const input = document.getElementById("refVisitDate");
  if (!input) return;
  const d = new Date();
  if (type === "tomorrow") {
    d.setDate(d.getDate() + 1);
  }
  input.value = d.toISOString().split("T")[0];
}

function submitReferralForm(e) {
  e.preventDefault();
  
  const leadId = document.getElementById("referralLeadId").value;
  const name = document.getElementById("refPatientName").value.trim();
  const phone = document.getElementById("refPatientPhone").value.trim();
  const visitDate = document.getElementById("refVisitDate").value;
  const remarks = document.getElementById("refRemarks").value.trim();
  
  if (!leadId || !name || !phone || !visitDate) {
    showToast("Please fill all required fields", "warning");
    return;
  }
  
  const customFieldsData = collectDynamicFields("referralCustomFieldsContainer");

  const newRef = {
    referralId: "R-" + Date.now(),
    leadId,
    patientName: name,
    patientPhone: phone,
    visitDate,
    remarks,
    reached: "Pending",
    reachedDetails: null,
    admissionId: "",
    owner: currentUser.id,
    archived: false,
    customFields: customFieldsData
  };
  
  db.saveReferral(newRef);
  showToast("Patient referral logged successfully!", "success");
  closeSheet("referralFormSheet");
  
  triggerSync(true);
  
  if (window.location.hash.startsWith("#/referrals")) {
    renderReferralsList();
  } else if (window.location.hash.startsWith("#/dashboard")) {
    renderDashboard();
  }
}

function populateReferralUpdateForm(ref) {
  const leads = db.getLeads();
  const lead = leads.find(l => l.leadId === ref.leadId);
  const leadName = lead ? lead.organisation : "Unknown Lead";
  
  document.getElementById("refUpdateId").value = ref.referralId;
  document.getElementById("refUpdateReached").value = ref.reached || "";
  
  // Render referral custom fields in update display
  let customFieldsHtml = "";
  const registeredFields = db.getFormFields().filter(f => f.target === "referral");
  if (registeredFields.length > 0) {
    customFieldsHtml = `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dotted rgba(255,255,255,0.15);">`;
    registeredFields.forEach(f => {
      const val = ref.customFields?.[f.id] ?? "-";
      customFieldsHtml += `<strong>${f.label}:</strong> ${val}<br>`;
    });
    customFieldsHtml += `</div>`;
  }
  
  document.getElementById("refUpdateDetailsDisplay").innerHTML = `
    <strong>Patient:</strong> ${ref.patientName} (${ref.patientPhone})<br>
    <strong>Hospital:</strong> ${leadName}<br>
    <strong>Visit Scheduled:</strong> ${ref.visitDate}<br>
    <strong>Creation Notes:</strong> ${ref.remarks || "-"}${customFieldsHtml}
  `;
  
  document.getElementById("refServiceOpd").checked = !!ref.reachedDetails?.opd;
  document.getElementById("refServiceIpd").checked = !!ref.reachedDetails?.ipd;
  document.getElementById("refServiceInvestigations").checked = !!ref.reachedDetails?.investigations;
  document.getElementById("refServiceMedicines").checked = !!ref.reachedDetails?.medicines;
  document.getElementById("refServiceConsultation").checked = !!ref.reachedDetails?.consultation;
  document.getElementById("refServiceReception").checked = !!ref.reachedDetails?.receptionEnquiry;
  document.getElementById("refUpdateAdmissionId").value = ref.admissionId || "";
  document.getElementById("refUpdateNotReachedRemarks").value = ref.reached === "No" ? ref.remarks || "" : "";
  
  toggleReferralStatusBoxes();
}

function toggleReferralStatusBoxes() {
  const reached = document.getElementById("refUpdateReached").value;
  const reachedBox = document.getElementById("refReachedBox");
  const notReachedBox = document.getElementById("refNotReachedBox");
  
  if (reached === "Yes") {
    reachedBox.style.display = "flex";
    notReachedBox.style.display = "none";
  } else if (reached === "No") {
    reachedBox.style.display = "none";
    notReachedBox.style.display = "flex";
  } else {
    reachedBox.style.display = "none";
    notReachedBox.style.display = "none";
  }
}

function submitReferralUpdateForm(e) {
  e.preventDefault();
  
  const refId = document.getElementById("refUpdateId").value;
  const reached = document.getElementById("refUpdateReached").value;
  
  if (!refId || !reached) {
    showToast("Please select a status", "warning");
    return;
  }
  
  const referrals = db.getReferrals();
  const ref = referrals.find(r => r.referralId === refId);
  if (!ref) {
    showToast("Referral not found", "error");
    return;
  }
  
  ref.reached = reached;
  
  if (reached === "Yes") {
    ref.reachedDetails = {
      opd: document.getElementById("refServiceOpd").checked,
      ipd: document.getElementById("refServiceIpd").checked,
      investigations: document.getElementById("refServiceInvestigations").checked,
      medicines: document.getElementById("refServiceMedicines").checked,
      consultation: document.getElementById("refServiceConsultation").checked,
      receptionEnquiry: document.getElementById("refServiceReception").checked
    };
    ref.admissionId = document.getElementById("refUpdateAdmissionId").value.trim();
  } else if (reached === "No") {
    ref.reachedDetails = null;
    ref.admissionId = "";
    ref.remarks = document.getElementById("refUpdateNotReachedRemarks").value.trim();
  }
  
  ref.updatedAt = new Date().toISOString();
  db.saveReferral(ref);
  
  showToast("Referral status updated successfully!", "success");
  closeSheet("referralUpdateSheet");
  
  triggerSync(true);
  
  if (window.location.hash.startsWith("#/referrals")) {
    renderReferralsList();
  } else if (window.location.hash.startsWith("#/dashboard")) {
    renderDashboard();
  }
}

// --- ADMIN PANEL AND DYNAMIC FORMS CONFIG ---
let activeAdminTab = "users";

function renderAdminPanel() {
  // Tabs navigation
  document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
  const activeTab = document.querySelector(`.admin-tab[onclick="switchAdminTab('${activeAdminTab}')"]`);
  if (activeTab) activeTab.classList.add("active");

  document.querySelectorAll(".admin-section").forEach(el => el.classList.remove("active"));
  const section = document.getElementById(`admin_${activeAdminTab}`);
  if (section) section.classList.add("active");

  if (activeAdminTab === "users") {
    renderAdminUsers();
  } else if (activeAdminTab === "reports") {
    renderAdminReports();
  } else if (activeAdminTab === "forms") {
    renderAdminForms();
  } else if (activeAdminTab === "sharing") {
    renderAdminSharing();
  } else if (activeAdminTab === "sync") {
    renderAdminSync();
  }
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  renderAdminPanel();
}

// 1. Users Admin
function renderAdminUsers() {
  const users = db.getUsers();
  const tbody = document.getElementById("adminUsersTableBody");
  tbody.innerHTML = "";

  users.forEach((user, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600; color:var(--primary);">${user.name}</td>
      <td><code>${user.pin}</code></td>
      <td>${user.role}</td>
      <td>
        <span class="sync-badge ${user.active ? "online" : "offline"}" style="padding:4px 8px; cursor:pointer;" onclick="toggleUserStatus(${idx})">
          ${user.active ? "Active" : "Disabled"}
        </span>
      </td>
      <td>
        <button class="action-icon-btn" onclick="editUser(${idx})" title="Edit User (Name/PIN)" style="margin-right: 6px; color: var(--primary); background: none; border: none; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
        </button>
        <button class="action-icon-btn delete" onclick="deleteUser(${idx})" title="Delete User">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Populate Lead Transfer Dropdowns
  const fromSelect = document.getElementById("transferFromUser");
  const toSelect = document.getElementById("transferToUser");
  if (fromSelect && toSelect) {
    const prevFrom = fromSelect.value;
    const prevTo = toSelect.value;
    
    fromSelect.innerHTML = `<option value="">-- Select Source Rep --</option>`;
    toSelect.innerHTML = `<option value="">-- Select Destination Rep --</option>`;
    
    users.forEach(u => {
      fromSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.role})</option>`;
      toSelect.innerHTML += `<option value="${u.id}">${u.name} (${u.role})</option>`;
    });
    
    fromSelect.value = prevFrom;
    toSelect.value = prevTo;
  }
}

function addNewUser(e) {
  e.preventDefault();
  const name = document.getElementById("newUserName").value.trim();
  const pin = document.getElementById("newUserPin").value.trim();
  const role = document.getElementById("newUserRole").value;

  if (!name || pin.length !== 4) {
    showToast("Invalid user name or PIN (Must be 4 digits)", "error");
    return;
  }

  const users = db.getUsers();
  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    showToast("Username already exists", "error");
    return;
  }

  users.push({ id: "U-" + Date.now(), name, pin, role, active: true });
  db.saveUsers(users);
  showToast("New user added successfully!", "success");
  
  // Clear
  document.getElementById("newUserName").value = "";
  document.getElementById("newUserPin").value = "";
  renderAdminUsers();
  triggerSync(true, true);
}

function toggleUserStatus(idx) {
  const users = db.getUsers();
  users[idx].active = !users[idx].active;
  db.saveUsers(users);
  showToast("User status updated!", "info");
  renderAdminUsers();
  triggerSync(true, true);
}

function deleteUser(idx) {
  const users = db.getUsers();
  const targetUser = users[idx];
  if (confirm(`Are you sure you want to delete user: ${targetUser.name}?`)) {
    targetUser.archived = true;
    targetUser.active = false;
    db.saveUsers([targetUser]);
    showToast("User deleted", "info");
    renderAdminUsers();
    triggerSync(true, true);
  }
}

function editUser(idx) {
  const users = db.getUsers();
  const user = users[idx];
  
  const newName = prompt(`Enter new name for ${user.name}:`, user.name);
  if (newName === null) return; // Cancelled
  const trimmedName = newName.trim();
  if (!trimmedName) {
    showToast("Name cannot be empty.", "error");
    return;
  }
  
  // Check duplicate names (excluding self)
  if (users.some((u, i) => i !== idx && u.name.toLowerCase() === trimmedName.toLowerCase())) {
    showToast("Username already exists.", "error");
    return;
  }
  
  const newPin = prompt(`Enter new 4-digit PIN for ${trimmedName}:`, user.pin);
  if (newPin === null) return; // Cancelled
  const trimmedPin = newPin.trim();
  if (trimmedPin.length !== 4 || isNaN(trimmedPin)) {
    showToast("Invalid PIN. Must be exactly 4 digits.", "error");
    return;
  }
  
  user.name = trimmedName;
  user.pin = trimmedPin;
  
  db.saveUsers(users);
  showToast(`User updated successfully!`, "success");
  
  // If the active user updated their own details, update their session
  if (currentUser && currentUser.id === user.id) {
    currentUser = user;
    localStorage.setItem("medtrack_session", JSON.stringify(user));
    document.getElementById("currentUserLabel").innerText = `${currentUser.name} (${currentUser.role})`;
  }
  
  renderAdminUsers();
  triggerSync(true, true);
}

function transferUserLeads(e) {
  e.preventDefault();
  const fromUser = document.getElementById("transferFromUser").value;
  const toUser = document.getElementById("transferToUser").value;
  
  if (!fromUser || !toUser) {
    showToast("Please select both source and destination representatives.", "warning");
    return;
  }
  if (fromUser === toUser) {
    showToast("Source and destination representatives must be different.", "warning");
    return;
  }
  
  const leads = db.get("leads") || [];
  const meetings = db.get("meetings") || [];
  const referrals = db.get("referrals") || [];
  
  let leadsCount = 0;
  let meetingsCount = 0;
  let referralsCount = 0;
  
  leads.forEach(l => {
    if (l.owner === fromUser) {
      l.owner = toUser;
      l.updatedAt = new Date().toISOString();
      leadsCount++;
    }
  });
  
  meetings.forEach(m => {
    if (m.owner === fromUser) {
      m.owner = toUser;
      meetingsCount++;
    }
  });
  
  referrals.forEach(r => {
    if (r.owner === fromUser) {
      r.owner = toUser;
      r.updatedAt = new Date().toISOString();
      referralsCount++;
    }
  });
  
  if (leadsCount === 0 && meetingsCount === 0 && referralsCount === 0) {
    showToast(`No records found for the selected source representative to transfer.`, "info");
    return;
  }
  
  const fromName = getUserDisplayName(fromUser);
  const toName = getUserDisplayName(toUser);
  
  if (confirm(`Are you sure you want to transfer ${leadsCount} leads, ${meetingsCount} meetings, and ${referralsCount} referrals from ${fromName} to ${toName}?`)) {
    db.set("leads", leads);
    db.set("meetings", meetings);
    db.set("referrals", referrals);
    
    showToast(`Successfully transferred ${leadsCount} leads to ${toName}!`, "success");
    
    document.getElementById("transferFromUser").value = "";
    document.getElementById("transferToUser").value = "";
    
    // Sync immediately
    triggerSync(true);
    
    // Refresh admin view
    renderAdminUsers();
  }
}

// 2. Inline Options Management Helpers
function renderOptionsManagerHTML(uniqueId, isStandard, configKeyOrIdx, optionsList, title = "Dropdown Options") {
  const chips = optionsList.map(opt => `
    <div class="option-chip" style="background: rgba(15, 76, 97, 0.05); border: 1px solid var(--primary-glow); padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem;">
      <span>${opt}</span>
      <span class="option-chip-delete" style="cursor: pointer; color: var(--danger); font-weight: bold; font-size: 0.85rem;" onclick="removeInlineOption('${uniqueId}', ${isStandard}, '${configKeyOrIdx}', '${opt.replace(/'/g, "\\'")}')">&times;</span>
    </div>
  `).join("");

  return `
    <div style="margin-top: 10px; padding: 10px; border-radius: var(--radius-sm); background: rgba(255,255,255,0.01); border: 1px solid var(--card-border);">
      <span style="font-size: 0.75rem; font-weight: 600; color: var(--primary); display: block; margin-bottom: 6px;">${title}</span>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
        ${chips || '<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">No options configured yet.</span>'}
      </div>
      <div style="display: flex; gap: 6px;">
        <input type="text" id="add_opt_input_${uniqueId}" class="form-control" style="height: 30px; font-size: 0.8rem; padding: 0 8px; flex: 1; border: 1px solid rgba(15, 76, 97, 0.28);" placeholder="Add option...">
        <button type="button" class="btn btn-primary" style="height: 30px; width: auto; padding: 0 12px; font-size: 0.75rem;" onclick="addInlineOption('${uniqueId}', ${isStandard}, '${configKeyOrIdx}')">Add</button>
      </div>
    </div>
  `;
}

function addInlineOption(uniqueId, isStandard, configKeyOrIdx) {
  const inputEl = document.getElementById(`add_opt_input_${uniqueId}`);
  if (!inputEl) return;
  const val = inputEl.value.trim();
  if (!val) return;

  if (isStandard) {
    if (configKeyOrIdx.startsWith("stdFieldIdx_")) {
      const idx = parseInt(configKeyOrIdx.replace("stdFieldIdx_", ""));
      const stdFields = db.getStandardFields();
      const field = stdFields[idx];
      if (field) {
        if (!field.options) field.options = [];
        if (field.options.includes(val)) {
          showToast("Option already exists", "warning");
          return;
        }
        field.options.push(val);
        db.saveStandardFields(stdFields);
        showToast("Option added to standard field options", "success");
        applyStandardFieldsConfig();
      }
    } else {
      const config = db.getConfig();
      if (!config[configKeyOrIdx]) config[configKeyOrIdx] = [];
      if (config[configKeyOrIdx].includes(val)) {
        showToast("Option already exists", "warning");
        return;
      }
      config[configKeyOrIdx].push(val);
      db.saveConfig(config);
      showToast("Option added to dropdown", "success");
      db.init(); // Refresh default options across forms
    }
  } else {
    const fields = db.getFormFields();
    const fieldIdx = parseInt(configKeyOrIdx);
    const field = fields[fieldIdx];
    if (field) {
      if (!field.options) field.options = [];
      if (field.options.includes(val)) {
        showToast("Option already exists", "warning");
        return;
      }
      field.options.push(val);
      db.saveFormFields(fields);
      showToast("Option added to custom field options", "success");
    }
  }
  inputEl.value = "";
  renderAdminForms();
  triggerSync(true, true);
}

function removeInlineOption(uniqueId, isStandard, configKeyOrIdx, optionValue) {
  if (!confirm(`Are you sure you want to remove the option "${optionValue}"?`)) {
    return;
  }

  if (isStandard) {
    if (configKeyOrIdx.startsWith("stdFieldIdx_")) {
      const idx = parseInt(configKeyOrIdx.replace("stdFieldIdx_", ""));
      const stdFields = db.getStandardFields();
      const field = stdFields[idx];
      if (field && field.options) {
        const oIdx = field.options.indexOf(optionValue);
        if (oIdx !== -1) {
          field.options.splice(oIdx, 1);
          db.saveStandardFields(stdFields);
          showToast("Option removed", "info");
          applyStandardFieldsConfig();
        }
      }
    } else {
      const config = db.getConfig();
      if (config[configKeyOrIdx]) {
        const idx = config[configKeyOrIdx].indexOf(optionValue);
        if (idx !== -1) {
          config[configKeyOrIdx].splice(idx, 1);
          db.saveConfig(config);
          showToast("Option removed", "info");
          db.init();
        }
      }
    }
  } else {
    const fields = db.getFormFields();
    const fieldIdx = parseInt(configKeyOrIdx);
    const field = fields[fieldIdx];
    if (field && field.options) {
      const idx = field.options.indexOf(optionValue);
      if (idx !== -1) {
        field.options.splice(idx, 1);
        db.saveFormFields(fields);
        showToast("Option removed", "info");
      }
    }
  }
  renderAdminForms();
  triggerSync(true, true);
}

// Inline Custom Field Form Handlers
function toggleInlineAddFieldForm(target) {
  const form = document.getElementById(`add_field_form_${target}`);
  const arrow = document.getElementById(`arrow_${target}`);
  if (!form || !arrow) return;
  if (form.style.display === "none") {
    form.style.display = "flex";
    arrow.innerHTML = "&#9652;"; // up arrow
  } else {
    form.style.display = "none";
    arrow.innerHTML = "&#9662;"; // down arrow
  }
}

function handleNewTypeChangeInline(target) {
  const type = document.getElementById(`new_type_${target}`).value;
  const optionsGroup = document.getElementById(`new_options_group_${target}`);
  if (!optionsGroup) return;
  if (type === "dropdown" || type === "radio") {
    optionsGroup.style.display = "block";
  } else {
    optionsGroup.style.display = "none";
  }
}

function handleAddFormFieldInline(e, target) {
  e.preventDefault();
  const label = document.getElementById(`new_label_${target}`).value.trim();
  const type = document.getElementById(`new_type_${target}`).value;
  const mandatory = document.getElementById(`new_mandatory_${target}`).checked;
  const rawOptions = document.getElementById(`new_options_${target}`).value;

  if (!label) return;

  const id = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fields = db.getFormFields();
  if (fields.some(f => f.id === id)) {
    showToast("Field with a similar name already exists", "error");
    return;
  }

  let optionsList = [];
  if ((type === "dropdown" || type === "radio") && rawOptions) {
    optionsList = rawOptions.split(",").map(o => o.trim()).filter(o => o.length > 0);
  }

  fields.push({
    id,
    label,
    type,
    mandatory,
    options: optionsList,
    active: true,
    target
  });

  db.saveFormFields(fields);
  showToast("Dynamic form updated! Field added.", "success");

  // Reset form inputs
  document.getElementById(`new_label_${target}`).value = "";
  document.getElementById(`new_options_${target}`).value = "";
  document.getElementById(`new_mandatory_${target}`).checked = false;
  document.getElementById(`new_type_${target}`).value = "text";
  handleNewTypeChangeInline(target);
  
  // Hide inline form
  toggleInlineAddFieldForm(target);

  // Refresh
  renderAdminForms();
  triggerSync(true, true);
}

// 3. Custom & Standard Form Fields Controller
let editingStdFieldId = null;

function applyStandardFieldsConfig() {
  const fields = db.getStandardFields();
  fields.forEach(field => {
    const labelEl = document.getElementById(`lbl_${field.id}`);
    const inputEl = document.getElementById(field.id);
    
    if (labelEl) {
      labelEl.innerText = field.label;
      if (field.mandatory) {
        labelEl.classList.add("required");
      } else {
        labelEl.classList.remove("required");
      }
    }
    
    if (inputEl) {
      const active = field.active !== false;
      const containerEl = inputEl.closest(".form-group") || inputEl;
      
      // Determine the desired tag name and type attribute
      let desiredTag = "input";
      let desiredType = "text";
      
      let typeDisplay = field.type;
      if (!typeDisplay) {
        typeDisplay = "text";
        if (field.id === "leadAudience" || field.id === "leadStatus" || field.id === "meetingPurpose" || field.id === "meetingOutcome" || field.id === "meetingLeadId" || field.id === "referralLeadId") {
          typeDisplay = "dropdown";
        } else if (field.id === "leadRevenue") {
          typeDisplay = "number";
        } else if (field.id === "leadFollowup" || field.id === "meetingDate" || field.id === "meetingFollowup" || field.id === "refVisitDate") {
          typeDisplay = "date";
        } else if (field.id === "meetingNotes" || field.id === "refRemarks") {
          typeDisplay = "textarea";
        }
      }

      if (typeDisplay === "dropdown" || typeDisplay === "radio") {
        desiredTag = "select";
      } else if (typeDisplay === "textarea") {
        desiredTag = "textarea";
      } else if (typeDisplay === "number") {
        desiredTag = "input";
        desiredType = "number";
      } else if (typeDisplay === "date") {
        desiredTag = "input";
        desiredType = "date";
      } else {
        desiredTag = "input";
        desiredType = "text";
      }

      // Check if tag swapping is needed
      let currentTag = inputEl.tagName.toLowerCase();
      let currentType = inputEl.getAttribute("type") ? inputEl.getAttribute("type").toLowerCase() : "";
      
      let needSwap = false;
      if (currentTag !== desiredTag) {
        needSwap = true;
      } else if (desiredTag === "input" && currentType !== desiredType) {
        needSwap = true;
      }

      let activeInputEl = inputEl;
      if (needSwap) {
        const newEl = document.createElement(desiredTag);
        newEl.id = field.id;
        newEl.className = inputEl.className;
        if (desiredTag === "input") {
          newEl.setAttribute("type", desiredType);
        }
        if (inputEl.placeholder) {
          newEl.placeholder = inputEl.placeholder;
        }
        newEl.value = inputEl.value;
        
        inputEl.replaceWith(newEl);
        activeInputEl = newEl;
      }

      // If it is a dropdown select, populate options
      if (desiredTag === "select") {
        activeInputEl.innerHTML = "";
        
        let opts = field.options || [];
        if (opts.length === 0) {
          if (field.id === "leadAudience") opts = db.getConfig().audienceTypes || [];
          else if (field.id === "leadStatus") opts = db.getConfig().leadStatuses || [];
          else if (field.id === "meetingPurpose") opts = db.getConfig().meetingPurposes || [];
          else if (field.id === "meetingOutcome") opts = db.getConfig().meetingOutcomes || [];
        }

        // Add a blank option if not mandatory
        if (!field.mandatory) {
          const emptyOpt = document.createElement("option");
          emptyOpt.value = "";
          emptyOpt.innerText = "-- Select Option --";
          activeInputEl.appendChild(emptyOpt);
        }

        opts.forEach(opt => {
          const optEl = document.createElement("option");
          optEl.value = opt;
          optEl.innerText = opt;
          activeInputEl.appendChild(optEl);
        });
      }

      if (field.mandatory && active) {
        if (activeInputEl.tagName === "INPUT" || activeInputEl.tagName === "SELECT" || activeInputEl.tagName === "TEXTAREA") {
          activeInputEl.setAttribute("required", "true");
        } else {
          const nameInput = activeInputEl.querySelector('input[id$="Name"]');
          if (nameInput) nameInput.setAttribute("required", "true");
        }
      } else {
        if (activeInputEl.tagName === "INPUT" || activeInputEl.tagName === "SELECT" || activeInputEl.tagName === "TEXTAREA") {
          activeInputEl.removeAttribute("required");
        } else {
          const nameInput = activeInputEl.querySelector('input[id$="Name"]');
          if (nameInput) nameInput.removeAttribute("required");
        }
      }
      
      if (active) {
        containerEl.style.display = "";
      } else {
        containerEl.style.display = "none";
        containerEl.querySelectorAll("input, select, textarea").forEach(el => el.removeAttribute("required"));
      }
    }
  });

  // Toggle wrapper containers leadPoc1 and leadPoc2 depending on if their sub-fields are active
  const poc1Active = (fields.find(f => f.id === "leadPoc1Name")?.active !== false) ||
                     (fields.find(f => f.id === "leadPoc1Phone")?.active !== false) ||
                     (fields.find(f => f.id === "leadPoc1Specialization")?.active !== false);
  const wrapper1 = document.getElementById("leadPoc1");
  if (wrapper1) wrapper1.style.display = poc1Active ? "" : "none";

  const poc2Active = (fields.find(f => f.id === "leadPoc2Name")?.active !== false) ||
                     (fields.find(f => f.id === "leadPoc2Phone")?.active !== false) ||
                     (fields.find(f => f.id === "leadPoc2Specialization")?.active !== false);
  const wrapper2 = document.getElementById("leadPoc2");
  if (wrapper2) wrapper2.style.display = poc2Active ? "" : "none";
}

function editStdField(id) {
  const stdFields = db.getStandardFields();
  const field = stdFields.find(f => f.id === id);
  if (!field) return;

  editingStdFieldId = id;
  document.getElementById("editStdFieldId").innerText = id;
  document.getElementById("editStdLabel").value = field.label;
  
  // Determine standard field type
  let typeDisplay = field.type;
  if (!typeDisplay) {
    typeDisplay = "text";
    if (field.id === "leadAudience" || field.id === "leadStatus" || field.id === "meetingPurpose" || field.id === "meetingOutcome" || field.id === "meetingLeadId" || field.id === "referralLeadId") {
      typeDisplay = "dropdown";
    } else if (field.id === "leadRevenue") {
      typeDisplay = "number";
    } else if (field.id === "leadFollowup" || field.id === "meetingDate" || field.id === "meetingFollowup" || field.id === "refVisitDate") {
      typeDisplay = "date";
    } else if (field.id === "meetingNotes" || field.id === "refRemarks") {
      typeDisplay = "textarea";
    } else if (field.id === "leadPoc1" || field.id === "leadPoc2") {
      typeDisplay = "poc block";
    }
  }
  document.getElementById("editStdType").value = typeDisplay;
  document.getElementById("editStdMandatory").checked = field.mandatory;
  
  // Disable type changer for critical fields
  const criticalFields = ["leadOrg", "meetingLeadId", "referralLeadId", "refPatientName"];
  if (criticalFields.includes(id)) {
    document.getElementById("editStdType").disabled = true;
  } else {
    document.getElementById("editStdType").disabled = false;
  }

  handleEditStdTypeChange();
  if (typeDisplay === "dropdown" || typeDisplay === "radio") {
    // If it's standard dropdown with custom options, or hardcoded options
    let opts = field.options || [];
    if (opts.length === 0) {
      if (id === "leadAudience") opts = db.getConfig().audienceTypes;
      else if (id === "leadStatus") opts = db.getConfig().leadStatuses;
      else if (id === "meetingPurpose") opts = db.getConfig().meetingPurposes;
      else if (id === "meetingOutcome") opts = db.getConfig().meetingOutcomes;
    }
    document.getElementById("editStdOptions").value = (opts || []).join(", ");
  } else {
    document.getElementById("editStdOptions").value = "";
  }
  
  document.getElementById("standardFieldEditor").style.display = "block";
  document.getElementById("standardFieldEditor").scrollIntoView({ behavior: 'smooth' });
}

function handleEditStdTypeChange() {
  const type = document.getElementById("editStdType").value;
  const optionsGroup = document.getElementById("editStdOptionsGroup");
  if (!optionsGroup) return;
  if (type === "dropdown" || type === "radio") {
    optionsGroup.style.display = "block";
  } else {
    optionsGroup.style.display = "none";
  }
}

function toggleStdFieldActive(id) {
  const criticalFields = ["leadOrg", "meetingLeadId", "referralLeadId", "refPatientName"];
  if (criticalFields.includes(id)) {
    showToast("This field is critical for linkage and cannot be disabled.", "error");
    return;
  }

  const stdFields = db.getStandardFields();
  const idx = stdFields.findIndex(f => f.id === id);
  if (idx !== -1) {
    const currentActive = stdFields[idx].active !== false;
    stdFields[idx].active = !currentActive;
    
    db.saveStandardFields(stdFields);
    showToast(`${stdFields[idx].label} state changed`, "info");
    applyStandardFieldsConfig();
    renderAdminForms();
    triggerSync(true, true);
  }
}

function cancelStdFieldEdit() {
  editingStdFieldId = null;
  document.getElementById("standardFieldEditor").style.display = "none";
}

function saveStdFieldChange() {
  if (!editingStdFieldId) return;

  const stdFields = db.getStandardFields();
  const idx = stdFields.findIndex(f => f.id === editingStdFieldId);
  if (idx !== -1) {
    const field = stdFields[idx];
    field.label = document.getElementById("editStdLabel").value.trim();
    field.mandatory = document.getElementById("editStdMandatory").checked;
    
    const criticalFields = ["leadOrg", "meetingLeadId", "referralLeadId", "refPatientName"];
    if (!criticalFields.includes(editingStdFieldId)) {
      const newType = document.getElementById("editStdType").value;
      field.type = newType;
      if (newType === "dropdown" || newType === "radio") {
        const rawOptions = document.getElementById("editStdOptions").value;
        field.options = rawOptions.split(",").map(o => o.trim()).filter(o => o.length > 0);
      } else {
        field.options = [];
      }
    }
    
    db.saveStandardFields(stdFields);
    showToast("Standard field updated!", "success");
    applyStandardFieldsConfig();
    cancelStdFieldEdit();
    renderAdminForms();
    triggerSync(true, true);
  }
}

function toggleFormFieldActive(idx) {
  const fields = db.getFormFields();
  fields[idx].active = !fields[idx].active;
  db.saveFormFields(fields);
  showToast("Field state changed", "info");
  renderAdminForms();
  triggerSync(true, true);
}

function deleteFormField(idx) {
  const fields = db.getFormFields();
  const targetField = fields[idx];
  if (confirm(`Are you sure you want to remove field: ${targetField.label}?`)) {
    targetField.archived = true;
    targetField.active = false;
    db.saveFormFields([targetField]);
    showToast("Dynamic field deleted", "info");
    renderAdminForms();
    triggerSync(true, true);
  }
}

let editingCustFieldIdx = null;

function editCustField(idx) {
  const fields = db.getFormFields();
  const field = fields[idx];
  if (!field) return;

  editingCustFieldIdx = idx;
  document.getElementById("editCustFieldId").innerText = field.id;
  document.getElementById("editCustLabel").value = field.label;
  document.getElementById("editCustType").value = field.type;
  document.getElementById("editCustMandatory").checked = field.mandatory;
  
  handleEditTypeChange();
  if (field.type === "dropdown" || field.type === "radio") {
    document.getElementById("editCustOptions").value = (field.options || []).join(", ");
  } else {
    document.getElementById("editCustOptions").value = "";
  }

  document.getElementById("customFieldEditor").style.display = "block";
  document.getElementById("customFieldEditor").scrollIntoView({ behavior: 'smooth' });
}

function handleEditTypeChange() {
  const type = document.getElementById("editCustType").value;
  const optionsGroup = document.getElementById("editCustOptionsGroup");
  if (!optionsGroup) return;
  if (type === "dropdown" || type === "radio") {
    optionsGroup.style.display = "block";
  } else {
    optionsGroup.style.display = "none";
  }
}

function cancelCustFieldEdit() {
  editingCustFieldIdx = null;
  document.getElementById("customFieldEditor").style.display = "none";
}

function saveCustFieldChange() {
  if (editingCustFieldIdx === null) return;

  const fields = db.getFormFields();
  const field = fields[editingCustFieldIdx];
  if (!field) return;

  const newLabel = document.getElementById("editCustLabel").value.trim();
  const newType = document.getElementById("editCustType").value;
  const newMandatory = document.getElementById("editCustMandatory").checked;
  const rawOptions = document.getElementById("editCustOptions").value;

  if (!newLabel) {
    showToast("Field label cannot be empty", "error");
    return;
  }

  field.label = newLabel;
  field.type = newType;
  field.mandatory = newMandatory;

  if (newType === "dropdown" || newType === "radio") {
    field.options = rawOptions.split(",").map(o => o.trim()).filter(o => o.length > 0);
  } else {
    field.options = [];
  }

  db.saveFormFields(fields);
  showToast("Custom field updated successfully!", "success");
  
  cancelCustFieldEdit();
  renderAdminForms();
  triggerSync(true, true);
}

function renderAdminForms() {
  const container = document.getElementById("unifiedFormsContainer");
  if (!container) return;
  container.innerHTML = "";

  const targets = [
    { key: "lead", name: "Referral Lead Form Settings", desc: "Configuration for managing hospital / clinic leads and POC profiles." },
    { key: "meeting", name: "Visit Interaction Form Settings", desc: "Configuration for logging sales visits and discussions." },
    { key: "referral", name: "Patient Referral Form Settings", desc: "Configuration for patient referral logs and status tracking." }
  ];

  const stdFields = db.getStandardFields();
  const customFields = db.getFormFields();

  targets.forEach(target => {
    const targetStdFields = stdFields.filter(f => f.target === target.key);
    const targetCustomFields = customFields.map((f, index) => ({ ...f, index })).filter(f => f.target === target.key);

    const card = document.createElement("div");
    card.className = "glass form-settings-card";
    card.style = "padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--bg-card); display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;";
    
    let inlineFormHTML = `
      <div class="inline-add-field-container glass" style="padding: 12px; border-radius: var(--radius-md); border: 1px dashed var(--primary-glow); background: rgba(15, 76, 97, 0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleInlineAddFieldForm('${target.key}')">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">+ Add Custom Field to Form</span>
          <span id="arrow_${target.key}" style="font-size: 0.8rem;">&#9662;</span>
        </div>
        <form id="add_field_form_${target.key}" style="display: none; margin-top: 12px; flex-direction: column; gap: 10px;" onsubmit="handleAddFormFieldInline(event, '${target.key}')">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Field Label</label>
              <input type="text" id="new_label_${target.key}" class="form-control" style="height: 34px; font-size: 0.8rem; border: 1px solid rgba(15, 76, 97, 0.28);" placeholder="E.g. Department" required>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-size: 0.75rem;">Data Type</label>
              <select id="new_type_${target.key}" class="form-control" style="height: 34px; font-size: 0.8rem;" onchange="handleNewTypeChangeInline('${target.key}')" required>
                <option value="text">Single Line Text</option>
                <option value="textarea">Paragraph Text / Remark Box</option>
                <option value="number">Number</option>
                <option value="dropdown">Dropdown Options</option>
                <option value="radio">Multiple Choice Options (Radio)</option>
                <option value="checkbox">Checkbox (True/False)</option>
              </select>
            </div>
          </div>
          <div id="new_options_group_${target.key}" class="form-group" style="display: none; margin: 0;">
            <label class="form-label" style="font-size: 0.75rem;">Options (Comma-separated)</label>
            <input type="text" id="new_options_${target.key}" class="form-control" style="height: 34px; font-size: 0.8rem; border: 1px solid rgba(15, 76, 97, 0.28);" placeholder="OPD, IPD, Diagnostics">
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <label class="form-checkbox" style="margin: 0; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" id="new_mandatory_${target.key}">
              <span>Required Field</span>
            </label>
            <button type="submit" class="btn btn-primary" style="height: 30px; font-size: 0.75rem; width: auto; padding: 0 12px;">Add Field</button>
          </div>
        </form>
      </div>
    `;

    card.innerHTML = `
      <div class="form-settings-header" style="border-bottom: 1px solid var(--card-border); padding-bottom: 12px; margin-bottom: 8px;">
        <h3 style="color: var(--primary); font-size: 1.15rem; font-weight: 700; margin: 0;">${target.name}</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0;">${target.desc}</p>
      </div>
      ${inlineFormHTML}
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <h4 style="font-size: 0.85rem; color: var(--primary); margin: 4px 0 0 0;">Configured Fields</h4>
        <div id="fields_list_${target.key}" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    `;

    container.appendChild(card);
    const fieldsListContainer = document.getElementById(`fields_list_${target.key}`);

    // Render standard fields
    targetStdFields.forEach(field => {
      const active = field.active !== false;
      const isLinkageCritical = ["leadOrg", "meetingLeadId", "referralLeadId", "refPatientName"].includes(field.id);
      
      let typeDisplay = field.type;
      if (!typeDisplay) {
        typeDisplay = "text";
        if (field.id === "leadAudience" || field.id === "leadStatus" || field.id === "meetingPurpose" || field.id === "meetingOutcome" || field.id === "meetingLeadId" || field.id === "referralLeadId") {
          typeDisplay = "dropdown";
        } else if (field.id === "leadRevenue") {
          typeDisplay = "number";
        } else if (field.id === "leadFollowup" || field.id === "meetingDate" || field.id === "meetingFollowup" || field.id === "refVisitDate") {
          typeDisplay = "date";
        } else if (field.id === "meetingNotes" || field.id === "refRemarks") {
          typeDisplay = "textarea";
        } else if (field.id === "leadPoc1" || field.id === "leadPoc2") {
          typeDisplay = "poc block";
        }
      }

      let optionsHtml = "";
      if (field.id === "leadAudience") {
        optionsHtml = renderOptionsManagerHTML(`std_${field.id}`, true, "audienceTypes", db.getConfig().audienceTypes || [], "Manage Audience Type Options");
      } else if (field.id === "leadStatus") {
        optionsHtml = renderOptionsManagerHTML(`std_${field.id}_status`, true, "leadStatuses", db.getConfig().leadStatuses || [], "Manage Status Options") +
                      renderOptionsManagerHTML(`std_${field.id}_reasons`, true, "nonConversionReasons", db.getConfig().nonConversionReasons || [], "Manage Non-Conversion Reasons Options");
      } else if (field.id === "meetingPurpose") {
        optionsHtml = renderOptionsManagerHTML(`std_${field.id}`, true, "meetingPurposes", db.getConfig().meetingPurposes || [], "Manage Meeting Purpose Options");
      } else if (field.id === "meetingOutcome") {
        optionsHtml = renderOptionsManagerHTML(`std_${field.id}`, true, "meetingOutcomes", db.getConfig().meetingOutcomes || [], "Manage Outcome Status Options");
      } else if (field.type === "dropdown" || field.type === "radio") {
        // Render from standard field's own options list (stored inside standard_fields)
        const idx = stdFields.findIndex(f => f.id === field.id);
        optionsHtml = renderOptionsManagerHTML(`std_${field.id}`, true, `stdFieldIdx_${idx}`, field.options || [], "Manage Choices / Options");
      }

      const item = document.createElement("div");
      item.className = "field-item-card glass";
      item.style = "padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--bg-card); display: flex; flex-direction: column; gap: 8px;";
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <strong style="color: var(--primary); font-size: 0.85rem;">${field.label}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">(${field.id})</span>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              <span class="badge" style="background: rgba(15, 76, 97, 0.1); color: var(--primary); font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Standard</span>
              <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 500;">${typeDisplay}</span>
              <span class="badge" style="background: ${field.mandatory ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255,255,255,0.03)'}; color: ${field.mandatory ? 'var(--danger)' : 'var(--text-muted)'}; font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${field.mandatory ? 'Required' : 'Optional'}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="sync-badge ${active ? 'online' : 'offline'}" style="padding: 4px 8px; font-size: 0.7rem; cursor: ${isLinkageCritical ? 'not-allowed' : 'pointer'}; opacity: ${isLinkageCritical ? 0.6 : 1};" 
                  ${isLinkageCritical ? '' : `onclick="toggleStdFieldActive('${field.id}')"`}>
              ${active ? 'Enabled' : 'Disabled'}
            </span>
            <button class="action-icon-btn edit" style="background: var(--primary-glow); color: var(--primary); padding: 4px;" onclick="editStdField('${field.id}')" title="Edit Label/Mandatory">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        </div>
        ${optionsHtml}
      `;
      fieldsListContainer.appendChild(item);
    });

    // Render custom fields
    targetCustomFields.forEach(field => {
      const active = field.active !== false;

      let optionsHtml = "";
      if (field.type === "dropdown" || field.type === "radio") {
        optionsHtml = renderOptionsManagerHTML(`cust_${field.id}`, false, field.index, field.options || [], "Manage Choices / Options");
      }

      const item = document.createElement("div");
      item.className = "field-item-card glass";
      item.style = "padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--bg-card); display: flex; flex-direction: column; gap: 8px;";
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <strong style="color: var(--primary); font-size: 0.85rem;">${field.label}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">(${field.id})</span>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              <span class="badge" style="background: rgba(46, 204, 113, 0.1); color: #2ecc71; font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Custom</span>
              <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 500;">${field.type}</span>
              <span class="badge" style="background: ${field.mandatory ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255,255,255,0.03)'}; color: ${field.mandatory ? 'var(--danger)' : 'var(--text-muted)'}; font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${field.mandatory ? 'Required' : 'Optional'}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="sync-badge ${active ? 'online' : 'offline'}" style="padding: 4px 8px; font-size: 0.7rem; cursor: pointer;" onclick="toggleFormFieldActive(${field.index})">
              ${active ? 'Enabled' : 'Disabled'}
            </span>
            <button class="action-icon-btn edit" style="background: var(--primary-glow); color: var(--primary); padding: 4px;" onclick="editCustField(${field.index})" title="Edit Label/Mandatory">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn delete" style="padding: 4px;" onclick="deleteFormField(${field.index})" title="Delete Custom Field">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        ${optionsHtml}
      `;
      fieldsListContainer.appendChild(item);
    });
  });
}

// 4. Synchronization panel
function renderAdminSync() {
  const settings = db.getSyncSettings();
  const inputEl = document.getElementById("adminSyncUrlInput");
  if (inputEl) {
    inputEl.value = settings.url;
  }
  document.getElementById("adminLastSyncDisplay").innerText = settings.lastSync;
}

function saveSyncUrl() {
  const inputEl = document.getElementById("adminSyncUrlInput");
  if (inputEl) {
    const url = inputEl.value.trim();
    db.saveSyncSettings(url);
    showToast("Sync URL Saved!", "success");
  }
}

function forceSync() {
  triggerSync(false, true);
}

function resetFormFieldsConfigToDefault() {
  if (confirm("Are you sure you want to reset all Form Fields and Settings to factory defaults? This will erase custom fields, custom dropdown options, and restore standard fields. It will sync this reset immediately to Google Sheets.")) {
    localStorage.removeItem("medtrack_standard_fields");
    localStorage.removeItem("medtrack_form_fields");
    localStorage.removeItem("medtrack_config");
    db.init();
    applyStandardFieldsConfig();
    renderAdminForms();
    triggerSync(false, true);
    showToast("Configurations reset to defaults and synced!", "success");
  }
}

// --- GOOGLE APPS SCRIPT SYNC ENGINE ---
async function triggerSync(isSilent = false, pushConfig = false) {
  const settings = db.getSyncSettings();
  if (!settings.url) {
    if (!isSilent) showToast("Sync URL not configured! Running in local sandbox mode.", "warning");
    return;
  }

  const badge = document.getElementById("syncBadge");
  badge.classList.add("syncing");
  badge.innerText = "Syncing...";
  if (!isSilent) showToast("Initializing Sheet Sync...", "info");

  const pendingPush = localStorage.getItem("medtrack_pending_config_push") === "true";
  const shouldPushConfig = pushConfig || pendingPush;

  // Payload for post: sends data and optionally configurations
  const payload = {
    appVersion: "v25",
    leads: db.get("leads"), // Include archived elements to trigger server-side archives
    meetings: db.get("meetings"),
    referrals: db.get("referrals")
  };

  if (shouldPushConfig) {
    payload.users = db.getUsers();
    payload.config = db.getConfig();
    payload.formFields = db.getFormFields();
    payload.standardFields = db.getStandardFields();
  }

  try {
    const response = await fetch(settings.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    const serverData = await response.json();

    if (serverData && serverData.success) {
      if (shouldPushConfig) {
        localStorage.setItem("medtrack_pending_config_push", "false");
      }

      // Safe updates: Merge local changes with server configurations to prevent deletions
      if (serverData.users && serverData.users.length > 0) {
        const localUsers = db.get("users") || [];
        const mergedUsers = [...serverData.users];
        localUsers.forEach(lu => {
          if (!mergedUsers.some(su => (su.id && su.id === lu.id) || (su.name && lu.name && su.name.toLowerCase() === lu.name.toLowerCase()))) {
            mergedUsers.push(lu);
          }
        });
        db.set("users", mergedUsers);
      }
      if (serverData.config && Object.keys(serverData.config).length > 0) {
        db.set("config", serverData.config);
      }
      if (serverData.formFields && serverData.formFields.length > 0) {
        const localFields = db.get("form_fields") || [];
        const mergedFields = [...serverData.formFields];
        localFields.forEach(lf => {
          if (!mergedFields.some(sf => sf.id === lf.id)) {
            mergedFields.push(lf);
          }
        });
        db.set("form_fields", mergedFields);
      }
      if (serverData.standardFields && serverData.standardFields.length > 0) {
        const localStd = db.getStandardFields();
        const merged = localStd.map(lf => {
          const sf = serverData.standardFields.find(f => f.id === lf.id);
          return sf ? { ...lf, ...sf } : lf;
        });
        localStorage.setItem("medtrack_standard_fields", JSON.stringify(merged));
      }
      if (serverData.leads) db.set("leads", serverData.leads);
      if (serverData.meetings) db.set("meetings", serverData.meetings);
      if (serverData.referrals) db.set("referrals", serverData.referrals);

      const timestamp = new Date().toLocaleString();
      localStorage.setItem("medtrack_last_sync", timestamp);
      document.getElementById("adminLastSyncDisplay").innerText = timestamp;
      
      if (!isSilent) showToast("Bidirectional Sheets sync complete!", "success");
      
      badge.classList.remove("syncing");
      badge.classList.add("online");
      badge.classList.remove("offline");
      badge.innerText = "Synced";

      // Refresh whatever view is currently active
      handleRouting();
    } else {
      throw new Error("Invalid payload response from server");
    }
  } catch (error) {
    console.error("Sync error: ", error);
    if (!isSilent) {
      showToast("Sync failed: " + error.toString(), "error");
    }
    
    badge.classList.remove("syncing");
    badge.classList.add("offline");
    badge.classList.remove("online");
    badge.innerText = "Offline Cache";
  }
}

// --- UTILITIES ---
function getUserDisplayName(ownerId) {
  if (!ownerId) return "";
  const users = db.getUsers();
  const user = users.find(u => u.id === ownerId || u.name === ownerId);
  return user ? user.name : ownerId;
}

function showToast(msg, type = "success") {
  const toast = document.getElementById("toastNotification");
  toast.innerText = msg;
  toast.className = `notification-toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// FAB Sheet Toggle
function toggleFabMenu() {
  const sheet = document.getElementById("fabSheet");
  if (sheet.classList.contains("show")) {
    closeSheet("fabSheet");
  } else {
    showSheet("fabSheet");
  }
}

function handleFabItemClick(action) {
  toggleFabMenu();
  if (action === "addReferral") {
    showSheet("referralFormSheet");
  } else if (action === "addLead") {
    showSheet("leadFormSheet");
  } else if (action === "addMeeting") {
    showSheet("meetingFormSheet");
  }
}

let autoSyncTimerId = null;

function startAutoSyncTimer() {
  // Sync every 15 seconds (15,000 ms)
  const SYNC_INTERVAL = 15 * 1000;
  
  // Randomize initial delay slightly (between 2s and 5s) so users don't sync at the exact same millisecond
  const initialDelay = (2 + Math.random() * 3) * 1000;
  
  setTimeout(() => {
    attemptAutoSync();
    
    autoSyncTimerId = setInterval(() => {
      attemptAutoSync();
    }, SYNC_INTERVAL);
  }, initialDelay);
}

function isUserBusy() {
  const sheets = ["leadFormSheet", "meetingFormSheet", "leadDetailSheet", "meetingDetailSheet", "referralFormSheet", "referralUpdateSheet"];
  const hasOpenSheets = sheets.some(id => {
    const el = document.getElementById(id);
    return el && el.style.display !== "none" && el.style.display !== "";
  });
  if (hasOpenSheets) return true;

  const editors = ["standardFieldEditor", "customFieldEditor"];
  const hasOpenEditors = editors.some(id => {
    const el = document.getElementById(id);
    return el && el.style.display !== "none" && el.style.display !== "";
  });
  if (hasOpenEditors) return true;

  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
    return true;
  }
  return false;
}

function attemptAutoSync() {
  if (navigator.onLine && db.getSyncSettings().url && !isUserBusy()) {
    console.log("[Auto-Sync] Triggering background synchronization...");
    triggerSync(true);
  }
}

let focusSyncTimeout = null;
function triggerFocusSync() {
  if (navigator.onLine && db.getSyncSettings().url && !isUserBusy()) {
    clearTimeout(focusSyncTimeout);
    focusSyncTimeout = setTimeout(() => {
      console.log("[Focus Sync] Triggering background synchronization...");
      triggerSync(true);
    }, 1000);
  }
}

// ================= CUSTOM REPORTS BUILDER ENGINE =================

function getGroupByFields(dataset) {
  const fields = [];
  if (dataset === "leads") {
    fields.push({ id: "organisation", label: "Hospital / Clinic Organisation" });
    fields.push({ id: "audienceType", label: "Audience Type" });
    fields.push({ id: "owner", label: "Representative Owner" });
    fields.push({ id: "status", label: "Referral Status" });
    fields.push({ id: "nonConversionReason", label: "Reason for Non-Conversion" });
  } else if (dataset === "meetings") {
    fields.push({ id: "leadId", label: "Hospital / Clinic Organisation" });
    fields.push({ id: "purpose", label: "Meeting Purpose" });
    fields.push({ id: "outcome", label: "Outcome Status" });
    fields.push({ id: "owner", label: "Representative Owner" });
  } else if (dataset === "referrals") {
    fields.push({ id: "leadId", label: "Hospital / Clinic Organisation" });
    fields.push({ id: "reached", label: "Reached Status" });
    fields.push({ id: "owner", label: "Representative Owner" });
  }

  // Add custom fields for this target
  const target = dataset === "leads" ? "lead" : (dataset === "meetings" ? "meeting" : "referral");
  const customFields = db.getFormFields().filter(f => f.target === target && f.active);
  customFields.forEach(f => {
    fields.push({ id: f.id, label: f.label + " (Custom)" });
  });

  return fields;
}

function getMetricFields(dataset) {
  const fields = [];
  if (dataset === "leads") {
    fields.push({ id: "revenuePotential", label: "Est. Revenue Value (₹)" });
  }

  const target = dataset === "leads" ? "lead" : (dataset === "meetings" ? "meeting" : "referral");
  const customFields = db.getFormFields().filter(f => f.target === target && f.active && f.type === "number");
  customFields.forEach(f => {
    fields.push({ id: f.id, label: f.label + " (Custom)" });
  });

  return fields;
}

function calculateReportData(report) {
  let dataset = [];
  if (report.dataset === "leads") {
    dataset = db.getLeads();
  } else if (report.dataset === "meetings") {
    dataset = db.getMeetings();
  } else if (report.dataset === "referrals") {
    dataset = db.getReferrals();
  }

  // Filter based on active representative filters if selected in dashboard dropdown
  const repSelect = document.getElementById("dashboardRepFilter");
  let selectedRep = "All";
  if (repSelect) {
    selectedRep = repSelect.value || "All";
  }
  if (currentUser && currentUser.role === "Rep") {
    selectedRep = currentUser.id;
  }
  if (selectedRep !== "All") {
    dataset = dataset.filter(item => item.owner === selectedRep);
  }

  // Also apply date filters based on dashboard timeframe selection
  dataset = dataset.filter(item => {
    const itemDate = item.createdAt || item.date || item.visitDate;
    return matchDashboardTimeframe(itemDate);
  });

  // Grouping
  const groups = {};
  dataset.forEach(item => {
    let groupKey = item[report.groupBy];
    if (groupKey === undefined && item.customFields) {
      groupKey = item.customFields[report.groupBy];
    }
    
    // Resolve leadId grouping key to actual organization name
    if (report.groupBy === "leadId") {
      const lead = db.getLeads().find(l => l.leadId === groupKey);
      groupKey = lead ? lead.organisation : (groupKey || "Unknown Lead");
    }

    // Resolve owner ID grouping key to user display name
    if (report.groupBy === "owner") {
      groupKey = getUserDisplayName(groupKey);
    }

    if (groupKey === undefined || groupKey === null || groupKey === "") {
      groupKey = "Not Specified";
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });

  // Numeric extraction helper
  const getNumericValue = (item, fieldId) => {
    let val = item[fieldId];
    if (val === undefined && item.customFields) {
      val = item.customFields[fieldId];
    }
    if (val === undefined || val === null || val === "") {
      return 0;
    }
    const cleanVal = String(val).replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? 0 : parsed;
  };

  const results = [];
  for (const [key, items] of Object.entries(groups)) {
    let val = 0;
    if (report.metricType === "count") {
      val = items.length;
    } else {
      let total = 0;
      items.forEach(item => {
        total += getNumericValue(item, report.calcField);
      });
      if (report.metricType === "sum") {
        val = total;
      } else if (report.metricType === "avg") {
        val = items.length > 0 ? (total / items.length) : 0;
      }
    }
    results.push({ group: key, value: val });
  }

  results.sort((a, b) => b.value - a.value);
  return results;
}

function renderCustomReports() {
  const container = document.getElementById("customReportsDashboardContainer");
  if (!container) return;

  const reports = db.getCustomReports();
  if (reports.length === 0) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "block";
  container.innerHTML = "";

  reports.forEach(report => {
    const data = calculateReportData(report);
    
    // Resolve Group By Label
    const groupByFields = getGroupByFields(report.dataset);
    const matchedGroupBy = groupByFields.find(f => f.id === report.groupBy);
    const groupByLabel = matchedGroupBy ? matchedGroupBy.label : "Group Field";

    // Resolve Metric Label
    let metricLabel = "";
    if (report.metricType === "count") {
      metricLabel = "Record Count";
    } else {
      const metricFields = getMetricFields(report.dataset);
      const matchedMetric = metricFields.find(f => f.id === report.calcField);
      const metricName = matchedMetric ? matchedMetric.label : "Metric Field";
      metricLabel = report.metricType === "sum" ? `Total ${metricName}` : `Avg ${metricName}`;
    }

    const reportCard = document.createElement("div");
    reportCard.className = "chart-card glass";
    reportCard.style.marginTop = "20px";

    const header = document.createElement("div");
    header.className = "chart-header";
    header.innerHTML = `
      <span>${report.title}</span>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
        ${report.dataset.toUpperCase()} &bull; ${report.metricType.toUpperCase()}
      </span>
    `;
    reportCard.appendChild(header);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "admin-table-wrapper";

    if (data.length === 0) {
      tableWrapper.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No matching records found for this report.
        </div>
      `;
    } else {
      const table = document.createElement("table");
      table.className = "admin-table";
      
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>${groupByLabel}</th>
          <th style="text-align: right;">${metricLabel}</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      
      const formatValue = (val) => {
        const isCurrency = report.calcField === "revenuePotential" || report.calcField === "leadRevenue" || (report.title && report.title.toLowerCase().includes("revenue")) || (report.title && report.title.toLowerCase().includes("value"));
        if (isCurrency) {
          return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        }
        return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      };

      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight: 600; color: var(--primary);">${row.group}</td>
          <td style="text-align: right; font-weight: 700;">${formatValue(row.value)}</td>
        `;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableWrapper.appendChild(table);
    }

    reportCard.appendChild(tableWrapper);
    container.appendChild(reportCard);
  });
}

function handleReportDatasetChange() {
  const datasetSelect = document.getElementById("reportDataset");
  if (!datasetSelect) return;

  const dataset = datasetSelect.value;
  const groupBySelect = document.getElementById("reportGroupBy");
  const calcFieldSelect = document.getElementById("reportCalcField");

  // Populate Group By fields
  groupBySelect.innerHTML = "";
  const groupByFields = getGroupByFields(dataset);
  groupByFields.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.innerText = f.label;
    groupBySelect.appendChild(opt);
  });

  // Populate Calc fields
  calcFieldSelect.innerHTML = "";
  const metricFields = getMetricFields(dataset);
  metricFields.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.innerText = f.label;
    calcFieldSelect.appendChild(opt);
  });

  handleReportMetricTypeChange();
}

function handleReportMetricTypeChange() {
  const metricTypeSelect = document.getElementById("reportMetricType");
  const calcFieldGroup = document.getElementById("reportCalcFieldGroup");
  const calcFieldSelect = document.getElementById("reportCalcField");

  if (!metricTypeSelect) return;

  const metricType = metricTypeSelect.value;
  if (metricType === "sum" || metricType === "avg") {
    calcFieldGroup.style.display = "block";
    calcFieldSelect.setAttribute("required", "required");
  } else {
    calcFieldGroup.style.display = "none";
    calcFieldSelect.removeAttribute("required");
  }
}

function renderAdminReports() {
  const tbody = document.getElementById("adminReportsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const reports = db.getCustomReports();

  // Make sure current dataset fields are populated
  const datasetSelect = document.getElementById("reportDataset");
  if (datasetSelect && document.getElementById("reportGroupBy").children.length === 0) {
    handleReportDatasetChange();
  }

  reports.forEach((report, idx) => {
    const tr = document.createElement("tr");
    
    // Format groupBy label
    const groupByFields = getGroupByFields(report.dataset);
    const matchedGroupBy = groupByFields.find(f => f.id === report.groupBy);
    const groupByLabel = matchedGroupBy ? matchedGroupBy.label : report.groupBy;

    // Format metric label
    let metricLabel = "";
    if (report.metricType === "count") {
      metricLabel = "Count of records";
    } else {
      const metricFields = getMetricFields(report.dataset);
      const matchedMetric = metricFields.find(f => f.id === report.calcField);
      const metricName = matchedMetric ? matchedMetric.label : report.calcField;
      metricLabel = report.metricType === "sum" ? `Sum of ${metricName}` : `Avg of ${metricName}`;
    }

    tr.innerHTML = `
      <td style="font-weight: 600; color: var(--primary);">${report.title}</td>
      <td style="text-transform: capitalize;">${report.dataset}</td>
      <td>${groupByLabel}</td>
      <td>${metricLabel}</td>
      <td style="text-align: center;">
        <button type="button" class="action-icon-btn" onclick="editCustomReport(${idx})" title="Edit Report" style="margin-right: 6px; color: var(--primary); background: none; border: none; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
        </button>
        <button type="button" class="action-icon-btn delete" onclick="deleteCustomReport(${idx})" title="Delete Report" style="color: var(--danger); background: none; border: none; cursor: pointer;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function saveCustomReport(e) {
  e.preventDefault();
  
  const title = document.getElementById("reportTitle").value.trim();
  const dataset = document.getElementById("reportDataset").value;
  const groupBy = document.getElementById("reportGroupBy").value;
  const metricType = document.getElementById("reportMetricType").value;
  const calcField = document.getElementById("reportCalcField").value;
  const editIndexVal = document.getElementById("editReportIndex").value;

  if (!title) {
    showToast("Report title is required", "error");
    return;
  }

  const reports = db.getCustomReports();
  const newReport = { title, dataset, groupBy, metricType, calcField };

  if (editIndexVal !== "") {
    const idx = parseInt(editIndexVal);
    reports[idx] = newReport;
    showToast("Custom report updated", "success");
  } else {
    reports.push(newReport);
    showToast("Custom report created", "success");
  }

  db.saveCustomReports(reports);
  cancelReportEdit();
  renderAdminReports();
  triggerSync(true); // Bidirectional cloud sync
}

function editCustomReport(idx) {
  const reports = db.getCustomReports();
  const report = reports[idx];
  if (!report) return;

  document.getElementById("reportTitle").value = report.title;
  document.getElementById("reportDataset").value = report.dataset;
  
  // Populate dropdowns for this dataset
  handleReportDatasetChange();

  document.getElementById("reportGroupBy").value = report.groupBy;
  document.getElementById("reportMetricType").value = report.metricType;
  
  // Update metric type fields visibility
  handleReportMetricTypeChange();

  if (report.metricType === "sum" || report.metricType === "avg") {
    document.getElementById("reportCalcField").value = report.calcField;
  }

  document.getElementById("editReportIndex").value = idx;
  document.getElementById("reportFormTitle").innerText = "Edit Custom Report";
  document.getElementById("cancelReportBtn").style.display = "inline-block";
  
  // Scroll to top of report builder form
  document.getElementById("customReportForm").scrollIntoView({ behavior: "smooth" });
}

function deleteCustomReport(idx) {
  if (!confirm("Are you sure you want to delete this custom report?")) return;

  const reports = db.getCustomReports();
  reports.splice(idx, 1);
  db.saveCustomReports(reports);
  
  renderAdminReports();
  showToast("Custom report deleted", "success");
  triggerSync(true); // Sync deleted config to sheet
}

function cancelReportEdit() {
  document.getElementById("reportTitle").value = "";
  document.getElementById("reportDataset").value = "leads";
  handleReportDatasetChange();

  document.getElementById("editReportIndex").value = "";
  document.getElementById("reportFormTitle").innerText = "Add Custom Report";
  document.getElementById("cancelReportBtn").style.display = "none";
}


// Bind focus and visibilitychange events for instant tab-switching sync
window.addEventListener("focus", triggerFocusSync);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    triggerFocusSync();
  }
});

// --- APP RUNTIME INITIALIZATION ---
window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", () => {
  applyStandardFieldsConfig();
  handleRouting();

  // Listen to network status to update icon indicator
  const updateOnlineStatus = () => {
    const badge = document.getElementById("syncBadge");
    if (navigator.onLine) {
      badge.classList.add("online");
      badge.classList.remove("offline");
      badge.innerText = "Online Cache";
    } else {
      badge.classList.remove("online");
      badge.classList.add("offline");
      badge.innerText = "Offline";
    }
  };

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  // Bind forms submit actions
  document.getElementById("leadFormEl").addEventListener("submit", submitLeadForm);
  document.getElementById("meetingFormEl").addEventListener("submit", submitMeetingForm);
  document.getElementById("referralFormEl").addEventListener("submit", submitReferralForm);
  document.getElementById("referralUpdateFormEl").addEventListener("submit", submitReferralUpdateForm);

  // Start background auto sync timer
  startAutoSyncTimer();

  // Register service worker with direct network check for updates (no-cache)
  if ("serviceWorker" in navigator) {
    let refreshing = false;
    let updatePending = false;



    const tryReload = () => {
      if (updatePending && !isUserBusy() && !refreshing) {
        refreshing = true;
        console.log("[Service Worker] Live update applied! Reloading client...");
        window.location.reload();
      }
    };

    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      console.log("[Service Worker] Registered successfully");

      // Check for updates periodically (every 5 minutes)
      setInterval(() => {
        reg.update();
      }, 5 * 60 * 1000);

      // Listen for updates found in the background
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[Service Worker] New update installed!");
              updatePending = true;
              tryReload();
            }
          });
        }
      });
    }).catch((err) => {
      console.error("[Service Worker] Registration failed: ", err);
    });

    // Detect when new SW takes control (claims the client)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[Service Worker] Controller claimed clients");
      updatePending = true;
      tryReload();
    });

    // Check for updates when route changes (hiding/showing sheets)
    window.addEventListener("hashchange", () => {
      setTimeout(tryReload, 500);
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
      });
    });

    // Check for updates when app is focused (swiped from background or screen unlocked)
    window.addEventListener("focus", () => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.update();
      });
      setTimeout(tryReload, 1000);
    });
  }
});
