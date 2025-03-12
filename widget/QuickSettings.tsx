import { Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";

import AstalHyprland from "gi://AstalHyprland";
import AstalMpris from "gi://AstalMpris";
import AstalTray from "gi://AstalTray";
import AstalBluetooth from "gi://AstalBluetooth";
import AstalNetwork from "gi://AstalNetwork";
import AstalWp from "gi://AstalWp";
import AstalBattery from "gi://AstalBattery";
import { GetAppInfo } from "../utils/AppInfo";
import Pango from "gi://Pango?version=1.0";

const mpris = AstalMpris.get_default();
const hyprland = AstalHyprland.get_default();
const tray = AstalTray.get_default();
const bluetooth = AstalBluetooth.get_default();
const network = AstalNetwork.get_default();
const wp = AstalWp.get_default();
const battery = AstalBattery.get_default();

export default function QuickSettings(monitor: Gdk.Monitor) {
  let audioOutputChooser = new Gtk.ComboBoxText();
  audioOutputChooser.visible = true;
  wp?.audio.speakers.forEach((endpoint) => {
    audioOutputChooser.append(endpoint.id.toString(), endpoint.description);
  });
  wp?.audio.connect("speaker-added", (source, endpoint) => {
    audioOutputChooser.append(endpoint.id.toString(), endpoint.description);
  });
  wp?.audio.connect("speaker-removed", (source, endpoint) => {
    audioOutputChooser.remove_all();
    wp?.audio.speakers.forEach((endpoint) => {
      audioOutputChooser.append(endpoint.id.toString(), endpoint.description);
    });
  });
  bind(wp?.audio.defaultSpeaker!, "id").subscribe((id) => {
    audioOutputChooser.activeId = id.toString();
  });
  audioOutputChooser.connect("changed", (self) => {
    wp?.audio.speakers
      .find((e) => {
        return e.id.toString() == self.activeId;
      })
      ?.set_is_default(true);
  });
  return (
    <window
      name="quicksettings"
      className="quicksettings"
      namespace="quicksettings"
      widthRequest={400}
      margin={8 | 8}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      visible={false}
      layer={Astal.Layer.TOP}
      gdkmonitor={monitor}
      application={App}
    >
      <box css="margin: 18px" vertical={true} spacing={8}>
        <box margin-bottom={4}>
          <label className="header" label="设置" />
          <box hexpand={true} />
          <icon icon="view-more-symbolic" />
        </box>

        <box hexpand={true} spacing={4}>
          <icon icon={bind(wp?.audio.defaultSpeaker!, "volumeIcon")} />
          <label className="settings-entry-label" label="音量" />
          {audioOutputChooser}
          <label
            className="settings-entry-status"
            label={bind(wp?.audio.defaultSpeaker!, "volume").as(
              (vol) => Math.round(vol * 99) + "%",
            )}
          />
        </box>
        <slider
          value={bind(wp?.audio.defaultSpeaker!, "volume")}
          setup={(self) => {
            self.min = 0.0;
            self.max = 1.0;
            self.value = wp?.audio.defaultSpeaker.volume!;
          }}
          onDragged={(self) => {
            wp?.audio.defaultSpeaker.set_volume(self.value);
          }}
        />

        <box spacing={8} homogeneous={true}>
          <button
            className="settings-entry"
            onClicked={() => {
              execAsync([
                "env",
                "XDG_CURRENT_DESKTOP=gnome",
                "gnome-control-center",
                "wifi",
              ]);
            }}
            setup={(self) => {
              network.wifi.connect("state-changed", (wifi, newState) => {
                self.className =
                  newState == 100 ? "settings-entry-active" : "settings-entry";
              });
              self.className =
                network.wifi.state == 100
                  ? "settings-entry-active"
                  : "settings-entry";
            }}
          >
            <box spacing={4}>
              <box vertical={true} spacing={4}>
                <box spacing={4}>
                  <icon icon="network-wireless-symbolic" />
                  <label className="settings-entry-label" label="网络" />
                </box>
                <label
                  className="settings-entry-status"
                  label="-"
                  ellipsize={Pango.EllipsizeMode.END}
                  setup={(self) => {
                    let updateState = (
                      wifi: AstalNetwork.Wifi,
                      newState: AstalNetwork.DeviceState,
                    ) => {
                      // uhh enum is fucked somehow
                      switch (newState) {
                        case 20:
                          self.label = "Wifi已禁用";
                          break;
                        case 30:
                          self.label = "Wifi已断开";
                          break;
                        case 100:
                          self.label = "已连接: " + wifi.activeAccessPoint.ssid;
                          break;
                      }
                    };
                    network.wifi.connect("state-changed", (wifi, newState) => {
                      updateState(wifi, newState);
                    });
                    updateState(network.wifi, network.wifi.state);
                  }}
                />
              </box>
              <box hexpand={true} />
              <Gtk.Separator visible={true} />
              <icon icon="go-next-symbolic" />
            </box>
          </button>
          <button
            className="settings-entry"
            onClicked={() => {
              execAsync([
                "env",
                "XDG_CURRENT_DESKTOP=gnome",
                "gnome-control-center",
                "bluetooth",
              ]);
            }}
          >
            <box spacing={4}>
              <box vertical={true} spacing={4}>
                <box spacing={4}>
                  <icon icon="bluetooth-active-symbolic" />
                  <label className="settings-entry-label" label="蓝牙" />
                </box>
                <label
                  className="settings-entry-status"
                  label="未连接设备"
                  ellipsize={Pango.EllipsizeMode.END}
                />
              </box>
              <box hexpand={true} />
              <Gtk.Separator visible={true} />
              <icon icon="go-next-symbolic" />
            </box>
          </button>
        </box>
        <box spacing={8} homogeneous={true}>
          <button className="settings-entry">
            <box spacing={4}>
              <box vertical={true} spacing={4}>
                <box spacing={4}>
                  <icon icon="night-light-symbolic" />
                  <label className="settings-entry-label" label="夜览" />
                </box>
                <label
                  className="settings-entry-status"
                  label="已启用"
                  ellipsize={Pango.EllipsizeMode.END}
                />
              </box>
              <box hexpand={true} />
              <Gtk.Separator visible={true} />
              <icon icon="go-next-symbolic" />
            </box>
          </button>
          <button className="settings-entry">
            <box spacing={4}>
              <box vertical={true} spacing={4}>
                <box spacing={4}>
                  <icon icon="package-x-generic-symbolic" />
                  <label className="settings-entry-label" label="系统升级" />
                </box>
                <label
                  className="settings-entry-status"
                  label="正在刷新..."
                  ellipsize={Pango.EllipsizeMode.END}
                />
              </box>
              <box hexpand={true} />
              <Gtk.Separator visible={true} />
              <icon icon="go-next-symbolic" />
            </box>
          </button>
        </box>
      </box>
    </window>
  );
}
