import { Variable, bind, execAsync, exec } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";

import AstalHyprland from "gi://AstalHyprland";
import AstalMpris from "gi://AstalMpris";
import AstalTray from "gi://AstalTray";
import AstalBluetooth from "gi://AstalBluetooth";
import AstalNetwork from "gi://AstalNetwork";
import AstalWp from "gi://AstalWp";
import AstalBattery from "gi://AstalBattery";
import { GetAppInfo } from "../utils/AppInfo";

const mpris = AstalMpris.get_default();
const hyprland = AstalHyprland.get_default();
const tray = AstalTray.get_default();
const bluetooth = AstalBluetooth.get_default();
const network = AstalNetwork.get_default();
const wp = AstalWp.get_default();
const battery = AstalBattery.get_default();

const time = Variable<string>("").poll(1000, 'date "+%B %d %A %H:%M:%S"');
const anyMediaPlaying: Variable<boolean> = Variable(false);

const UpdatePlaybackStatus = () => {
  for (const player of mpris.get_players()) {
    if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING) {
      anyMediaPlaying.set(true);
      return;
    }
  }
  anyMediaPlaying.set(false);
};

// just a system badge like macOS
function SystemIcon(): JSX.Element {
  return (
    <button
      css="padding: 0;"
      onButtonPressEvent={() => {
        execAsync("missioncenter");
      }}
    >
      <icon
        setup={(self) => {
          const uname = exec("uname -a");
          if (uname.includes("asahi")) {
            self.icon = "asahilinux";
          }
        }}
        icon="linux-symbolic"
        css="color: white; font-size: 14px;"
      />
    </button>
  );
}

// App icon and name
function AppBadge(): JSX.Element {
  return (
    <box className="appbadge">
      <icon
        css="font-size:12px"
        icon={bind(hyprland, "focusedClient").as((client) => {
          if (client == null) return "";
          const curAppInfo = GetAppInfo(client.get_class());
          return client.get_class() == ""
            ? ""
            : (curAppInfo?.get_string("Icon") ?? "application-x-executable"); // default icon
        })}
        visible={bind(hyprland, "focusedClient").as((client) => {
          if (client == null) return false;
          const curAppInfo = GetAppInfo(client.get_class());
          return client.get_class() != "" && curAppInfo != undefined;
        })}
      />
      <label
        label={bind(hyprland, "focusedClient").as((client) => {
          if (client == null) return "桌面";
          const curAppInfo = GetAppInfo(client.get_class());
          return client.get_class() == ""
            ? "桌面"
            : (curAppInfo?.get_name() ?? client.get_class());
        })}
      />
    </box>
  );
}

function WindowTitle(): JSX.Element {
  return (
    <label
      className="windowtitle"
      css="color: white"
      truncate={true}
      setup={(self) => {
        hyprland.connect("event", (hyprland, event, args) => {
          if (hyprland.focusedClient != null) {
            self.label = hyprland.focusedClient.title;
            bind(hyprland.focusedClient, "title").subscribe((title) => {
              self.label = title;
            });
          }
          self.visible = hyprland.focusedClient != null;
        });
      }}
    ></label>
  );
}

function WindowGroup(): JSX.Element {
  return (
    <box className="windowgroup">
      <AppBadge />
      <WindowTitle />
    </box>
  );
}

function WorkspaceIndicator(): JSX.Element {
  const windowStatus: Variable<string> = Variable("");
  hyprland.connect("event", () => {
    if (hyprland.focusedClient == null) return;
    for (const client of hyprland.get_clients()) {
      if (client.address == hyprland.focusedClient.address) {
        if (client.fullscreen) windowStatus.set("");
        else if (client.floating) windowStatus.set("");
        else windowStatus.set("");
        break;
      }
    }
  });
  const workspaceToLeft = Variable(false);
  const workspaceToRight = Variable(false);
  return (
    <box className="workspaceindicator">
      <box
        className="workspacepointer" // left pointer
        spacing={2}
        visible={workspaceToLeft()}
      >
        <icon css="font-size: 10px" icon="go-previous-symbolic" />
        <label
          className="preceedingws"
          label={bind(hyprland, "focusedWorkspace").as((focusedWorkspace) => {
            let preceedingWSCount = 0;
            for (const workspace of hyprland.get_workspaces()) {
              if (
                workspace.monitor.id == focusedWorkspace.monitor.id &&
                workspace.id < focusedWorkspace.id &&
                workspace.get_clients().length > 0
              ) {
                preceedingWSCount++;
              }
            }
            if (preceedingWSCount == 0) workspaceToLeft.set(false);
            else workspaceToLeft.set(true);
            return (
              (preceedingWSCount > 9 ? 9 : preceedingWSCount).toString() +
              (preceedingWSCount > 9 ? "+" : "")
            );
          })}
        />
      </box>

      <box className="workspacecenter">
        <label
          className="windowindicator"
          css="min-width: 1.2em"
          label={windowStatus()}
          visible={bind(hyprland, "focusedClient").as(
            (client) => (client?.get_class() ?? "") != "",
          )}
        />
        <AppBadge />
      </box>

      <box
        className="workspacepointer"
        spacing={2}
        visible={workspaceToRight()}
      >
        <label
          className="succeedingws"
          label={bind(hyprland, "focusedWorkspace").as((focusedWorkspace) => {
            let succeedingWSCount = 0;
            for (const workspace of hyprland.get_workspaces()) {
              if (
                workspace.monitor.id == focusedWorkspace.monitor.id &&
                workspace.id > focusedWorkspace.id &&
                workspace.get_clients().length > 0
              ) {
                succeedingWSCount++;
              }
            }
            if (succeedingWSCount == 0) workspaceToRight.set(false);
            else workspaceToRight.set(true);
            return (
              (succeedingWSCount > 9 ? 9 : succeedingWSCount).toString() +
              (succeedingWSCount > 9 ? "+" : "")
            );
          })}
        />
        <icon css="font-size: 10px;" icon="go-next-symbolic" />
      </box>
    </box>
  );
}

function Mpris(): JSX.Element {
  return (
    <button
      className={anyMediaPlaying() ? "mpris-active" : "mpris"}
      visible={anyMediaPlaying()}
      onClicked={() => {
        for (const player of mpris.get_players()) {
          if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING)
            player.play_pause();
        }
      }}
    >
      <icon icon="media-playback-start" />
    </button>
  );
}

function Bluetooth(): JSX.Element {
  execAsync("blueman-applet");
  return (
    <box>
      {bind(tray, "items").as((items) => {
        const bluemanItem = items.find((i) => i.id == "blueman");
        if (bluemanItem === undefined) {
          return <box />;
        }
        return (
          <menubutton
            tooltipMarkup={bind(bluemanItem, "tooltipMarkup")}
            usePopover={false}
            actionGroup={bind(bluemanItem, "actionGroup").as((ag) => [
              "dbusmenu",
              ag,
            ])}
            menuModel={bind(bluemanItem, "menuModel")}
          >
            <icon
              iconSize={12}
              icon={bind(bluetooth, "isPowered").as(
                (on) => `bluetooth-${on ? "active" : "disabled"}-symbolic`,
              )}
            />
          </menubutton>
        );
      })}
    </box>
  );
}

function Network(): JSX.Element {
  const WifiIndicator = () => (
    <box name="wifi">
      <icon
        iconSize={12}
        icon={bind(network.wifi, "iconName").as((name) => {
          return name != null ? name : "network-offline-symbolic";
        })}
      />
    </box>
  );
  const WiredIndicator = () => (
    <box name="wired">
      <icon
        iconSize={12}
        icon={
          network.wired != null
            ? bind(network.wired, "iconName")
            : "network-offline-symbolic"
        }
      />
    </box>
  );

  execAsync("nm-applet");
  return (
    <box>
      {bind(tray, "items").as((items) => {
        const nmappletItem = items.find((i) => i.id == "nm-applet")!;
        if (nmappletItem === undefined) {
          return <box />;
        }
        return (
          <menubutton
            tooltipMarkup={bind(nmappletItem, "tooltipMarkup")}
            usePopover={false}
            actionGroup={bind(nmappletItem, "actionGroup").as((ag) => [
              "dbusmenu",
              ag,
            ])}
            menuModel={bind(nmappletItem, "menuModel")}
          >
            <stack
              shown={bind(network, "primary").as((p) =>
                p == AstalNetwork.Primary.WIFI ? "wifi" : "wired",
              )}
              hexpand={true}
              halign={Gtk.Align.CENTER}
            >
              <WifiIndicator />
              <WiredIndicator />
            </stack>
          </menubutton>
        );
      })}
    </box>
  );
}

function Audio(): JSX.Element {
  return (
    <button
      onClick={(_, event) => {
        if (event.button == Astal.MouseButton.PRIMARY) {
          //toggle player panel
        } else if (event.button == Astal.MouseButton.SECONDARY) {
          execAsync("pwvucontrol");
        }
      }}
      onScroll={(_, event) => {
        if (event.delta_y < 0) {
          wp?.audio.defaultSpeaker.set_volume(
            wp?.audio.defaultSpeaker.volume + 0.01,
          );
        } else if (event.delta_y > 0) {
          wp?.audio.defaultSpeaker.set_volume(
            wp?.audio.defaultSpeaker.volume - 0.01,
          );
        }
      }}
    >
      <box spacing={4} css="margin:0;padding:0">
        <icon
          iconSize={12}
          icon={bind(wp?.audio.defaultSpeaker!, "volumeIcon")}
        />
        <label
          css="font-size: 10px"
          label={bind(wp?.audio.defaultSpeaker!, "volume").as(
            (vol) => Math.round(vol * 99) + "%",
          )}
        />
      </box>
    </button>
  );
}

function Battery(): JSX.Element {
  return (
    <box className="battery-container" visible={bind(battery, "isPresent")}>
      <box
        spacing={4}
        css="margin:0;padding:0"
        className={bind(battery, "charging").as((charging) =>
          battery.percentage * 100 <= 15 && !charging
            ? "battery-low"
            : "battery",
        )}
      >
        <icon iconSize={12} icon={bind(battery, "iconName")} />
        <label
          css="font-size: 10px"
          label={bind(battery, "percentage").as(
            (percentage) => Math.round(percentage * 100) + "%",
          )}
        />
      </box>
    </box>
  );
}

function MediaGroup(): JSX.Element {
  const UpdatePlaybackStatus = () => {
    for (const player of mpris.get_players()) {
      if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING) {
        anyMediaPlaying.set(true);
        return;
      }
    }
    anyMediaPlaying.set(false);
  };
  return (
    <box
      className={anyMediaPlaying().as((playing) =>
        playing ? "media-active" : "media",
      )}
      spacing={0}
      setup={(self) => {
        for (const player of mpris.get_players()) {
          bind(player, "playbackStatus").subscribe(UpdatePlaybackStatus);
        }
        mpris.connect("player-added", (_, player) => {
          bind(player, "playbackStatus").subscribe(UpdatePlaybackStatus);
        });
      }}
    >
      <Mpris />
      <Audio />
    </box>
  );
}

function Settings(): JSX.Element {
  return (
    <box spacing={0} className="settings">
      <Bluetooth />
      <Network />
      <ThemeToggle />
      <MediaGroup />
      <Battery />
    </box>
  );
}

function Tray(): JSX.Element {
  return (
    <box spacing={4} className="tray">
      {bind(tray, "items").as((items) =>
        items
          .reverse()
          .filter((i) => i.id != "nm-applet" && i.id != "blueman")
          .map((item) => {
            if (item.iconThemePath) App.add_icons(item.iconThemePath);
            return (
              <menubutton
                tooltipMarkup={bind(item, "tooltipMarkup")}
                usePopover={false}
                actionGroup={bind(item, "actionGroup").as((ag) => [
                  "dbusmenu",
                  ag,
                ])}
                menuModel={bind(item, "menuModel")}
              >
                <icon css="color: white" gIcon={bind(item, "gicon")} />
              </menubutton>
            );
          }),
      )}
    </box>
  );
}

function Clock(): JSX.Element {
  return (
    <label css="color: white" className="clock" yalign={0.5} label={time()} />
  );
}

function Options(): JSX.Element {
  return (
    <button
      css="margin: 0; padding:0;"
      onButtonPressEvent={() => {
        App.toggle_window("quicksettings");
      }}
    >
      <icon css="color: white" icon="list-ul-symbolic" />
    </button>
  );
}

function ThemeToggle(): JSX.Element {
  const toggleTheme = () => {
    const output = exec(
      "gsettings get org.gnome.desktop.interface color-scheme",
    ).trim();
    if (output.includes("prefer-dark")) {
      execAsync(
        "gsettings set org.gnome.desktop.interface color-scheme 'prefer-light'",
      );
      execAsync("gsettings set org.gnome.desktop.interface gtk-theme adw-gtk3");
    } else {
      execAsync(
        "gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'",
      );
      execAsync(
        "gsettings set org.gnome.desktop.interface gtk-theme adw-gtk3-dark",
      );
    }
  };
  return (
    <button onButtonPressEvent={toggleTheme}>
      <icon icon="display-brightness-symbolic" />
    </button>
  );
}

function LeftModules(): JSX.Element {
  return (
    <box spacing={8} halign={Gtk.Align.START}>
      <SystemIcon />
      <WorkspaceIndicator />
      <WindowTitle />
    </box>
  );
}

function RightModules(): JSX.Element {
  return (
    <box halign={Gtk.Align.END} spacing={8}>
      <Tray />
      <Settings />
      <Clock />
      <Options />
    </box>
  );
}

export default function Bar(monitor: Gdk.Monitor) {
  return (
    <window
      name={"bar-" + monitor}
      className="bar"
      namespace="bar"
      layer={Astal.Layer.TOP}
      margin={0 | 0}
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT
      }
      heightRequest={38}
      application={App}
    >
      <box vexpand={false} valign={Gtk.Align.CENTER}>
        <centerbox
          css="min-height: 30px; padding: 0 1em;"
          vexpand={false}
          hexpand={true}
        >
          <LeftModules />
          <box css="min-width: 250px;" />
          <RightModules />
        </centerbox>
      </box>
    </window>
  );
}
