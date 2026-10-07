package com.kutchbusiness.app

import android.content.Context

class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("kb_prefs", Context.MODE_PRIVATE)

    var sound: Boolean
        get() = sp.getBoolean("sound", true)
        set(v) = sp.edit().putBoolean("sound", v).apply()

    var vibrate: Boolean
        get() = sp.getBoolean("vibrate", true)
        set(v) = sp.edit().putBoolean("vibrate", v).apply()

    var bigText: Boolean
        get() = sp.getBoolean("bigText", true)
        set(v) = sp.edit().putBoolean("bigText", v).apply()

    var colorIndex: Int
        get() = sp.getInt("colorIndex", 0)
        set(v) = sp.edit().putInt("colorIndex", v).apply()
}
