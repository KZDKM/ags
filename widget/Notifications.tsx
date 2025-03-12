import { GLib, Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk, Widget } from "astal/gtk3";
import GObject, { register, property } from "astal/gobject";
import { timeout } from "astal/time";

import AstalNotifd from "gi://AstalNotifd";

const notification = AstalNotifd.get_default();

const time = (time: number, format = "%H:%M") =>
  GLib.DateTime.new_from_unix_local(time).format(format)!;

function Notification(n: AstalNotifd.Notification) {
  return (
    <eventbox
      onClick={(self, event) => {
        if (event.button == Astal.MouseButton.PRIMARY) {
          //n.dismiss()
        }
      }}
    >
      <box
        className="notification"
        vertical={true}
        spacing={4}
        setup={() => {}}
      >
        <box className="notification-notification-header" spacing={4}>
          {(n.appIcon || n.desktopEntry) && (
            <icon
              className="app-icon"
              visible={Boolean(n.appIcon || n.desktopEntry)}
              icon={n.appIcon || n.desktopEntry}
            />
          )}
          <label
            className="notification-app-name"
            halign={Gtk.Align.START}
            truncate
            label={n.appName || "Unknown"}
          />
          <label
            className="notification-time"
            hexpand
            halign={Gtk.Align.END}
            label={time(n.time)}
          />
          <button onClicked={() => n.dismiss()}>
            <icon icon="window-close-symbolic" />
          </button>
        </box>
        <Gtk.Separator visible />
        <box>
          <box valign={Gtk.Align.START} className="icon">
            <box
              setup={(self) => {
                if (n.get_image() != null) {
                  print(n.get_image());
                  self.css =
                    "background-image: url('" +
                    n.get_image() +
                    "');" +
                    "background-size: contain;" +
                    "background-repeat: no-repeat;" +
                    "background-position: center;";
                } else {
                  // TODO: handle empty icon
                  let icon = "dialog-information-symbolic";
                  if (n.get_app_icon() != null && n.get_app_icon() != "")
                    icon = n.get_app_icon();
                  self.child = <icon icon={icon} css="font-size:64px" />;
                }
              }}
            />
          </box>
          <box vertical={true}>
            <label
              className="title"
              xalign={0}
              justify={Gtk.Justification.LEFT}
              hexpand={true}
              maxWidthChars={24}
              truncate={true}
              wrap={true}
              label={n.summary}
            />
            <label
              className="body"
              hexpand={true}
              useMarkup={true}
              xalign={0}
              justify={Gtk.Justification.LEFT}
              label={n.body}
              wrap={true}
            />
          </box>
        </box>
        <box
          className="actions"
          setup={(self) => {
            self.children = n.get_actions().map((action, index, actions) => {
              return (
                <button
                  className="action-button"
                  hexpand={true}
                  onClick={(self, event) => {
                    if (event.button == Astal.MouseButton.PRIMARY) {
                      n.invoke(action.id);
                      n.dismiss();
                    }
                  }}
                >
                  <label label={action.label} />
                </button>
              );
            });
          }}
        />
      </box>
    </eventbox>
  );
}

export default function Notifications(monitor: Gdk.Monitor) {
  const nList = Variable<number[]>([]);
  return (
    <window
      gdkmonitor={monitor}
      name="notifications"
      className="notification-popups"
      namespace="notifications"
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      layer={Astal.Layer.TOP}
    >
      <box
        css="min-width: 2px; min-height: 2px"
        className="notifications"
        vertical={true}
      >
        <box
          vertical={true}
          setup={(self) => {
            notification.connect("notified", (notifications, id, replaced) => {
              const n = notifications.get_notification(id);
              if (n != null) {
                self.children = [Notification(n), ...self.children];
                nList.set([n.id, ...nList.get()]);
              }
            });
            notification.connect("resolved", (notifications, id, replaced) => {
              self.children[nList.get().indexOf(id)]?.destroy();
              nList.set(nList.get().filter((n) => n != id));
            });
          }}
        ></box>
      </box>
    </window>
  );
}
