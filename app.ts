import { App, Gdk, Gtk } from "astal/gtk3"
import style from "./style.css"
import Bar from "./widget/Bar"
import AppLauncher from "./widget/AppLauncher"
import Wallpaper from "./widget/Wallpaper"
import Notifications from "./widget/Notifications"
import QuickSettings from "./widget/QuickSettings"
import { Variable } from "../../../../usr/share/astal/gjs"

App.start({
    css: style,
    main() {

        App.add_icons("./assets")
 
        const primaryMonitor = () => {
            for (const monitor of App.get_monitors()) {
                if (monitor.get_model() == "Q27G3XMN") {
                    return monitor;
                }
            }
        }

        const wallpapers = new Map<Gdk.Monitor, Gtk.Widget>(); 
        const bars = new Map<Gdk.Monitor, Gtk.Widget>(); 
        const notifs = new Map<Gdk.Monitor, Gtk.Widget>(); 
        const launchers = new Map<Gdk.Monitor, Gtk.Widget>(); 
        const quicksettings = new Map<Gdk.Monitor, Gtk.Widget>(); 

        
        // initialize
        for (const gdkmonitor of App.get_monitors()) {
            if (gdkmonitor == primaryMonitor()) {
                bars.set(gdkmonitor, Bar(gdkmonitor))
                notifs.set(gdkmonitor, Notifications(gdkmonitor))
                launchers.set(gdkmonitor, AppLauncher(gdkmonitor))
                quicksettings.set(gdkmonitor, QuickSettings(gdkmonitor))
            }
            wallpapers.set(gdkmonitor, Wallpaper(gdkmonitor))
        }

        App.connect("monitor-added", (_, gdkmonitor) => {
            if (gdkmonitor == primaryMonitor()) {
                bars.set(gdkmonitor, Bar(gdkmonitor))
                notifs.set(gdkmonitor, Notifications(gdkmonitor))
                launchers.set(gdkmonitor, AppLauncher(gdkmonitor))
                quicksettings.set(gdkmonitor, QuickSettings(gdkmonitor))
            }
            wallpapers.set(gdkmonitor, Wallpaper(gdkmonitor))
        })

        App.connect("monitor-removed", (_, gdkmonitor) => {
            wallpapers.get(gdkmonitor)?.destroy()
            wallpapers.delete(gdkmonitor)
            bars.get(gdkmonitor)?.destroy()
            bars.delete(gdkmonitor)
            notifs.get(gdkmonitor)?.destroy()
            notifs.delete(gdkmonitor)
            launchers.get(gdkmonitor)?.destroy()
            launchers.delete(gdkmonitor)
            quicksettings.get(gdkmonitor)?.destroy()
            quicksettings.delete(gdkmonitor)
        })
    },
})
