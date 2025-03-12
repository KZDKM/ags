import { Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";

import AstalApps from "gi://AstalApps";
import { dockApp } from "../utils/Config";

const apps = new AstalApps.Apps({
  includeEntry: true,
  includeExecutable: true,
});

const AppEntry = (app: AstalApps.Application) => (
  <button
    className="app"
    onKeyPressEvent={(self, event) => {
      if (event.get_keyval()[1] == Gdk.KEY_Return) {
        App.toggle_window("applauncher");
        execAsync([
          "hyprctl",
          "dispatch",
          "exec",
          "uwsm app --",
          app.get_executable().split("%")[0],
        ]);
        app.frequency += 1;
      }
    }}
    onClick={(button, event) => {
      if (event.button == Astal.MouseButton.PRIMARY) {
        App.toggle_window("applauncher");
        //app.launch()
        execAsync([
          "hyprctl",
          "dispatch",
          "exec",
          "uwsm app --",
          app.get_executable().split("%")[0],
        ]);
        app.frequency += 1;
      } else {
        dockApp(app.get_entry());
      }
    }}
  >
    <box spacing={8}>
      <icon css="font-size: 42px" icon={app.iconName} />
      <centerbox>
        <box />
        <box vertical={true} spacing={2} valign={Gtk.Align.CENTER}>
          <label
            className="title"
            label={app.name}
            xalign={0}
            valign={Gtk.Align.CENTER}
            truncate={true}
          />
          <label
            className="description"
            label={app.description}
            visible={app.description != ""}
            xalign={0}
            valign={Gtk.Align.END}
            truncate={true}
          />
        </box>
        <box />
      </centerbox>
    </box>
  </button>
);

export default function AppLauncher(monitor: Gdk.Monitor) {
  const appList = Variable(apps.get_list());
  const entryList = Variable(appList.get().map(AppEntry));
  const entryNotEmpty = Variable(false);

  return (
    <window
      name="applauncher"
      className="applauncher"
      namespace="applauncher"
      onKeyPressEvent={(self, event) => {
        if (event.get_keyval()[1] == Gdk.KEY_Escape) {
          App.toggle_window("applauncher");
        }
      }}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.EXCLUSIVE}
      visible={false}
      gdkmonitor={monitor}
      application={App}
    >
      <box vertical={true} css="margin: 24px">
        <box>
          <icon icon="system-search-symbolic" />
          <entry
            hexpand={true}
            css="min-width: 500px"
            placeholderText="搜索"
            onActivate={() => {
              const results = appList.get();
              if (results[0]) {
                App.toggle_window("applauncher");
                execAsync([
                  "hyprctl",
                  "dispatch",
                  "exec",
                  "uwsm app --",
                  results[0].get_executable().split("%")[0],
                ]);
                results[0].frequency += 1;
              }
            }}
            onChanged={(entry) => {
              appList.drop();
              appList.set(apps.fuzzy_query(entry.get_text()));
              entryList.drop();
              entryList.set(appList.get().map(AppEntry));
              entryNotEmpty.set(entry.text != "");
            }}
            setup={(self) => {
              App.connect("window-toggled", (_, window) => {
                if (window.visible) {
                  self.text = "";
                  entryNotEmpty.set(false);
                  self.grab_focus();
                  appList.set(apps.get_list());
                  entryList.set(appList.get().map(AppEntry));
                }
              });
            }}
          />
        </box>
        <scrollable
          margin={0}
          hscroll={Gtk.PolicyType.NEVER}
          heightRequest={entryList().as((list) =>
            Math.min(
              (list[0]?.get_allocated_height() ?? 0) * 65 * 10,
              list.length * 65 * (list[0]?.get_allocated_height() ?? 0),
            ),
          )}
          visible={entryNotEmpty()}
        >
          <box vertical={true} spacing={12}>
            {entryList()}
          </box>
        </scrollable>
      </box>
    </window>
  );
}
