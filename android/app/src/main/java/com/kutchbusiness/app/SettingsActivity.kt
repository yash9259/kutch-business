package com.kutchbusiness.app

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.switchmaterial.SwitchMaterial

class SettingsActivity : AppCompatActivity() {

    private val permLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        title = "Notification settings"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        val prefs = Prefs(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(24))
        }

        fun header(t: String) = TextView(this).apply {
            text = t; textSize = 16f; setPadding(0, dp(20), 0, dp(6))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }

        fun toggle(label: String, value: Boolean, onChange: (Boolean) -> Unit) =
            SwitchMaterial(this).apply {
                text = label; isChecked = value
                setPadding(0, dp(8), 0, dp(8))
                setOnCheckedChangeListener { _, v -> onChange(v) }
            }

        root.addView(header("Alerts"))
        root.addView(toggle("Sound", prefs.sound) { prefs.sound = it })
        root.addView(toggle("Vibration", prefs.vibrate) { prefs.vibrate = it })
        root.addView(toggle("Show full message text", prefs.bigText) { prefs.bigText = it })

        root.addView(header("Accent colour"))
        val group = RadioGroup(this)
        NotificationHelper.COLORS.forEachIndexed { i, (name, _) ->
            group.addView(RadioButton(this).apply { id = 1000 + i; text = name })
        }
        group.check(1000 + prefs.colorIndex.coerceIn(NotificationHelper.COLORS.indices))
        group.setOnCheckedChangeListener { _, id -> prefs.colorIndex = id - 1000 }
        root.addView(group)

        root.addView(header("Test & system"))
        root.addView(Button(this).apply {
            text = "Send test notification"
            setOnClickListener {
                val ok = NotificationHelper.show(
                    this@SettingsActivity, "Kutch Business",
                    "This is how your notifications will look.", MainActivity.START_URL
                )
                if (!ok) {
                    Toast.makeText(context, "Notifications are blocked. Please allow them.", Toast.LENGTH_LONG).show()
                    if (android.os.Build.VERSION.SDK_INT >= 33) {
                        permLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }
        })
        root.addView(Button(this).apply {
            text = "Open Android notification settings"
            setOnClickListener {
                startActivity(
                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                )
            }
        })

        val scroll = ScrollView(this).apply { addView(root) }
        ViewCompat.setOnApplyWindowInsetsListener(scroll) { v, insets ->
            val b = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(b.left, 0, b.right, b.bottom)
            insets
        }
        setContentView(scroll)
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
