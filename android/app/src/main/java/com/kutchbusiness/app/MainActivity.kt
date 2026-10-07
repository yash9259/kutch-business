package com.kutchbusiness.app

import android.Manifest
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File

class MainActivity : AppCompatActivity() {

    companion object {
        const val START_URL = "https://www.kutchbusiness.com/"
        const val EXTRA_URL = "url"
        private const val OFFLINE_URL = "file:///android_asset/offline.html"

        private val NOTIFICATION_POLYFILL = """
            (function(){
              if (window.__kbNotif) return; window.__kbNotif = true;
              function N(title, opts){ opts = opts || {};
                Android.showNotification(String(title), String(opts.body || ''), String(opts.url || location.href));
                this.close = function(){}; this.onclick = null; }
              Object.defineProperty(N, 'permission', { get: function(){ return Android.hasPermission() ? 'granted' : 'default'; }});
              N.requestPermission = function(cb){ Android.requestPermission();
                var r = Android.hasPermission() ? 'granted' : 'default'; if (cb) cb(r); return Promise.resolve(r); };
              window.Notification = N;
            })();
        """.trimIndent()
    }

    private lateinit var webView: WebView
    private lateinit var swipe: SwipeRefreshLayout
    private lateinit var progress: ProgressBar

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingParams: WebChromeClient.FileChooserParams? = null
    private var cameraUri: Uri? = null
    private var ready = false

    private val notifPermLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    private val cameraPermLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            launchChooser(granted)
        }

    private val fileChooserLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            var uris: Array<Uri>? = null
            if (result.resultCode == RESULT_OK) {
                uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
                if (uris == null && cameraUri != null) uris = arrayOf(cameraUri!!)
            }
            filePathCallback?.onReceiveValue(uris)
            filePathCallback = null
        }

    private fun isOurHost(host: String?) =
        host != null && (host == "kutchbusiness.com" || host.endsWith(".kutchbusiness.com"))

    inner class Bridge {
        @JavascriptInterface
        fun showNotification(title: String, body: String, url: String) {
            NotificationHelper.show(this@MainActivity, title, body, url)
        }

        @JavascriptInterface
        fun hasPermission(): Boolean = NotificationHelper.hasPermission(this@MainActivity)

        @JavascriptInterface
        fun requestPermission() {
            runOnUiThread { askNotificationPermission() }
        }

        @JavascriptInterface
        fun retry() {
            runOnUiThread { webView.loadUrl(START_URL) }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        splash.setKeepOnScreenCondition { !ready }
        // Never keep the splash longer than 4 seconds, even on a slow network
        Handler(Looper.getMainLooper()).postDelayed({ ready = true }, 4000)
        setContentView(R.layout.activity_main)
        // Android 15+ draws apps edge-to-edge; keep the website clear of the status/navigation bars and keyboard
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.root)) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime()
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        webView = findViewById(R.id.webview)
        swipe = findViewById(R.id.swipe)
        progress = findViewById(R.id.progress)

        setupWebView()

        swipe.setOnRefreshListener { webView.reload() }
        swipe.setOnChildScrollUpCallback { _, _ -> webView.scrollY > 0 }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        askNotificationPermission()
        handleIntent(intent, initial = true)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent, initial = false)
    }

    private fun handleIntent(i: Intent?, initial: Boolean) {
        val url = i?.getStringExtra(EXTRA_URL)
        val target = if (!url.isNullOrBlank() && isOurHost(Uri.parse(url).host)) url else null
        if (target != null) webView.loadUrl(target)
        else if (initial) webView.loadUrl(START_URL)
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && !NotificationHelper.hasPermission(this)) {
            notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun setupWebView() {
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.addJavascriptInterface(Bridge(), "Android")

        webView.setDownloadListener { url, userAgent, contentDisposition, mime, _ ->
            try {
                val name = URLUtil.guessFileName(url, contentDisposition, mime)
                val req = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(mime)
                    addRequestHeader("User-Agent", userAgent)
                    addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url) ?: "")
                    setTitle(name)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
                }
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(req)
                Toast.makeText(this, "Downloading $name", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Download failed", Toast.LENGTH_SHORT).show()
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                val scheme = uri.scheme ?: ""
                if ((scheme == "http" || scheme == "https") && isOurHost(uri.host)) return false
                if (scheme == "file") return false
                try { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                catch (e: Exception) { Toast.makeText(this@MainActivity, "Cannot open link", Toast.LENGTH_SHORT).show() }
                return true
            }

            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                progress.visibility = View.VISIBLE
                if (isOurHost(Uri.parse(url).host)) view.evaluateJavascript(NOTIFICATION_POLYFILL, null)
            }

            override fun onPageFinished(view: WebView, url: String) {
                progress.visibility = View.GONE
                swipe.isRefreshing = false
                ready = true
                if (isOurHost(Uri.parse(url).host)) view.evaluateJavascript(NOTIFICATION_POLYFILL, null)
            }

            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                ready = true
                if (request.isForMainFrame) view.loadUrl(OFFLINE_URL)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
            }

            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                pendingParams = params

                val types = params.acceptTypes
                val wantsImage = types.isEmpty() || types.all { it.isBlank() } || types.any { it.startsWith("image") }
                when {
                    !wantsImage -> launchChooser(false)
                    ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED -> launchChooser(true)
                    else -> cameraPermLauncher.launch(Manifest.permission.CAMERA)
                }
                return true
            }
        }
    }

    private fun launchChooser(withCamera: Boolean) {
        val params = pendingParams ?: return
        cameraUri = null
        val extra = mutableListOf<Intent>()
        if (withCamera) {
            try {
                val dir = File(cacheDir, "images").apply { mkdirs() }
                val file = File.createTempFile("IMG_", ".jpg", dir)
                val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
                cameraUri = uri
                extra += Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, uri)
            } catch (_: Exception) { }
        }
        val chooser = Intent(Intent.ACTION_CHOOSER)
            .putExtra(Intent.EXTRA_INTENT, params.createIntent())
            .putExtra(Intent.EXTRA_TITLE, "Choose file")
        if (extra.isNotEmpty()) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toTypedArray())
        try {
            fileChooserLauncher.launch(chooser)
        } catch (e: Exception) {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean = when (item.itemId) {
        R.id.action_home -> { webView.loadUrl(START_URL); true }
        R.id.action_refresh -> { webView.reload(); true }
        R.id.action_settings -> { startActivity(Intent(this, SettingsActivity::class.java)); true }
        else -> super.onOptionsItemSelected(item)
    }

    override fun onResume() { super.onResume(); webView.onResume() }
    override fun onPause() { webView.onPause(); super.onPause() }
    override fun onDestroy() { webView.destroy(); super.onDestroy() }
}
