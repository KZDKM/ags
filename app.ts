import { App, Gdk, Gtk } from "astal/gtk3";
import style from "./style.css";
import Bar from "./widget/Bar";
import AppLauncher from "./widget/AppLauncher";
import Wallpaper from "./widget/Wallpaper";
import Notifications from "./widget/Notifications";
import QuickSettings from "./widget/QuickSettings";
import Dock from "./widget/Dock";
import { Variable } from "../../../../usr/share/astal/gjs";
import { configInit } from "./utils/Config";

const wallpapers = new Map<Gdk.Monitor, Gtk.Widget>();
// ok supposedly we are supporting multiple bars and launchers etc but its unused for now
const bars = new Map<Gdk.Monitor, Gtk.Widget>();
const notifs = new Map<Gdk.Monitor, Gtk.Widget>();
const launchers = new Map<Gdk.Monitor, Gtk.Widget>();
const quicksettings = new Map<Gdk.Monitor, Gtk.Widget>();
const docks = new Map<Gdk.Monitor, Gtk.Widget>();

App.start({
  css: style,
  main() {
    // initialize config system
    configInit();

    App.add_icons("./assets");

    const primaryMonitor = () => {
      for (const monitor of App.get_monitors()) {
        if (monitor.get_model() == "VX2719-2K-PRO") {
          return monitor;
        }
      }
    };

    // initialize
    for (const gdkmonitor of App.get_monitors()) {
      if (gdkmonitor == primaryMonitor()) {
        bars.set(gdkmonitor, Bar(gdkmonitor));
        notifs.set(gdkmonitor, Notifications(gdkmonitor));
        launchers.set(gdkmonitor, AppLauncher(gdkmonitor));
        quicksettings.set(gdkmonitor, QuickSettings(gdkmonitor));
        docks.set(gdkmonitor, Dock(gdkmonitor));
      }
      wallpapers.set(gdkmonitor, Wallpaper(gdkmonitor));
    }

    App.connect("monitor-added", (_, gdkmonitor) => {
      if (gdkmonitor == primaryMonitor()) {
        bars.set(gdkmonitor, Bar(gdkmonitor));
        notifs.set(gdkmonitor, Notifications(gdkmonitor));
        launchers.set(gdkmonitor, AppLauncher(gdkmonitor));
        quicksettings.set(gdkmonitor, QuickSettings(gdkmonitor));
        docks.set(gdkmonitor, Dock(gdkmonitor));
      }
      wallpapers.set(gdkmonitor, Wallpaper(gdkmonitor));
    });

    App.connect("monitor-removed", (_, gdkmonitor) => {
      wallpapers.get(gdkmonitor)?.destroy();
      wallpapers.delete(gdkmonitor);
      bars.get(gdkmonitor)?.destroy();
      bars.delete(gdkmonitor);
      notifs.get(gdkmonitor)?.destroy();
      notifs.delete(gdkmonitor);
      launchers.get(gdkmonitor)?.destroy();
      launchers.delete(gdkmonitor);
      quicksettings.get(gdkmonitor)?.destroy();
      quicksettings.delete(gdkmonitor);
      docks.get(gdkmonitor)?.destroy();
      docks.delete(gdkmonitor);
    });
  },
  requestHandler(request, res) {
    if (request == "hide dock") {
      docks.forEach((dock) => {
        dock.visible = false;
      });
    } else if (request == "show dock") {
      docks.forEach((dock) => {
        dock.visible = true;
      });
    }
  },
});
