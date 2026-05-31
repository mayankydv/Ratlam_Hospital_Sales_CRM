package com.example.ratlamhospitalcrm

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.*
import java.util.ArrayList

class MainActivity : Activity() {
    private var mUploadMessage: ValueCallback<Array<Uri>>? = null
    private val FILECHOOSER_RESULTCODE = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val webView = WebView(this)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.setGeolocationEnabled(true)
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: ""
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false
                }
                return true
            }
        }
        
        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                callback.invoke(origin, true, false)
            }
            
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                mUploadMessage?.onReceiveValue(null)
                mUploadMessage = filePathCallback

                val takePictureIntent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE)
                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                    putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                    putExtra(Intent.EXTRA_TITLE, "Image Chooser")
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
                }

                try {
                    startActivityForResult(chooserIntent, FILECHOOSER_RESULTCODE)
                } catch (e: Exception) {
                    mUploadMessage = null
                    return false
                }
                return true
            }
        }

        val permissions = arrayOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION,
            android.Manifest.permission.CAMERA
        )
        val listPermissionsNeeded = ArrayList<String>()
        for (p in permissions) {
            if (checkSelfPermission(p) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(p)
            }
        }
        if (listPermissionsNeeded.isNotEmpty()) {
            requestPermissions(listPermissionsNeeded.toTypedArray(), 100)
        }

        setContentView(webView)
        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mUploadMessage == null) return
            val result = if (data == null || resultCode != RESULT_OK) null else arrayOf(data.data!!)
            mUploadMessage?.onReceiveValue(result as Array<Uri>?)
            mUploadMessage = null
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }
}
