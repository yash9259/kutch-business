package com.kutchbusiness.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object NotificationHelper {

    val COLORS = listOf(
        "Blue" to 0xFF1565C0.toInt(),
        "Orange" to 0xFFEF6C00.toInt(),
        "Green" to 0xFF2E7D32.toInt(),
        "Red" to 0xFFC62828.toInt()
    )

    fun hasPermission(c: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    // Android channels are immutable once created, so sound/vibration choices map to separate channels.
    private fun ensureChannel(c: Context): String {
        val p = Prefs(c)
        val id = "kb_${if (p.sound) "s" else "m"}${if (p.vibrate) "v" else "n"}"
        val nm = c.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(id) == null) {
            val label = buildString {
                append("Kutch Business updates")
                if (!p.sound) append(" (no sound)")
                if (!p.vibrate) append(" (no vibration)")
            }
            val ch = NotificationChannel(id, label, NotificationManager.IMPORTANCE_HIGH)
            if (!p.sound) ch.setSound(null, null)
            ch.enableVibration(p.vibrate)
            ch.enableLights(true)
            nm.createNotificationChannel(ch)
        }
        return id
    }

    /** Returns false if notifications are not permitted. */
    fun show(c: Context, title: String, body: String, url: String?): Boolean {
        if (!hasPermission(c) || !NotificationManagerCompat.from(c).areNotificationsEnabled()) return false
        val p = Prefs(c)
        val notifId = System.currentTimeMillis().toInt()

        val open = Intent(c, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            if (!url.isNullOrBlank()) putExtra(MainActivity.EXTRA_URL, url)
        }
        val pi = PendingIntent.getActivity(
            c, notifId, open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val b = NotificationCompat.Builder(c, ensureChannel(c))
            .setSmallIcon(R.drawable.ic_stat_logo)
            .setContentTitle(title.ifBlank { c.getString(R.string.app_name) })
            .setContentText(body)
            .setColor(COLORS[p.colorIndex.coerceIn(COLORS.indices)].second)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pi)
        if (p.bigText) b.setStyle(NotificationCompat.BigTextStyle().bigText(body))

        NotificationManagerCompat.from(c).notify(notifId, b.build())
        return true
    }
}
