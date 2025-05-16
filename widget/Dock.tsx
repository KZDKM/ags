import { Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import { GetAppInfo } from "../utils/AppInfo";
import {
  readFile,
  readFileAsync,
  writeFile,
  writeFileAsync,
  monitorFile,
} from "astal/file";

import {
  registerConfigCallback,
  dockApp,
  undockApp,
  Config,
  updateConfig,
} from "../utils/Config";

import AstalHyprland from "gi://AstalHyprland";
import AstalApps from "gi://AstalApps";
const hyprland = AstalHyprland.get_default();

const apps = new AstalApps.Apps({ });

function PinnedApps() {
  // widget for a pinned app
  function PinnedApp(app: AstalApps.Application) {
    return (
      <box css={"margin: 0; padding: 0; min-height: 42px; min-width: 42px"}>
        <button
          onClick={() => {
            execAsync([
              "hyprctl",
              "dispatch",
              "exec",
              "uwsm app --",
              app.get_executable().split("%")[0],
            ]);
            app.frequency += 1;
          }}
        >
          <icon css={"font-size:42px"} icon={app.iconName} />
        </button>
      </box>
    );
  }

  const pinnedAppWidgets = Variable<Gtk.Widget[]>([]);

  const configCallback = (config: Config) => {
    let newApps: Gtk.Widget[] = [];
    const appList = apps.get_list();
    config.dockedApps.forEach((appName) => {
      const app = appList.find((app) => app.entry == appName);
      print(app);
      if (app != null) newApps.push(PinnedApp(app));
    });
    pinnedAppWidgets.set(newApps);
  };

  // read all pinned apps from config file
  registerConfigCallback(configCallback);
  updateConfig();
  return (
    <box visible={pinnedAppWidgets().as((widgets) => widgets.length != 0)}>
      {pinnedAppWidgets()}
    </box>
  );
}

export default function Dock(monitor: Gdk.Monitor) {
  return (
    <window
      name="dock"
      className="dock"
      namespace="dock"
      margin={4 | 4}
      anchor={Astal.WindowAnchor.BOTTOM}
      layer={Astal.Layer.TOP}
      gdkmonitor={monitor}
      application={App}
    >
      <centerbox css={"min-height: 50px; min-width: 10px"}>
        <box className={"dockcontainer"}>
          <PinnedApps />
        </box>
      </centerbox>
    </window>
  );
}
