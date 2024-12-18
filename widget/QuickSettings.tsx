import { Variable, bind, execAsync } from "astal"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"

import AstalHyprland from "gi://AstalHyprland"
import AstalMpris from "gi://AstalMpris"
import AstalTray from "gi://AstalTray"
import AstalBluetooth from "gi://AstalBluetooth"
import AstalNetwork from "gi://AstalNetwork"
import AstalWp from "gi://AstalWp"
import AstalBattery from "gi://AstalBattery"
import { GetAppInfo } from "../utils/appinfo"
import Pango from "gi://Pango?version=1.0"

const mpris = AstalMpris.get_default()
const hyprland = AstalHyprland.get_default()
const tray = AstalTray.get_default()
const bluetooth = AstalBluetooth.get_default()
const network = AstalNetwork.get_default()
const wp = AstalWp.get_default();
const battery = AstalBattery.get_default();

export default function QuickSettings(monitor: Gdk.Monitor) {
    return <window
        name="quicksettings"
        className="quicksettings"
        namespace="quicksettings"
        widthRequest={400}
        margin={8 | 8}
        anchor={
            Astal.WindowAnchor.TOP
            | Astal.WindowAnchor.RIGHT
        }
        visible={false}
        layer={Astal.Layer.TOP}
        gdkmonitor={monitor}
        application={App}
    >
        <box css="margin: 18px" vertical={true} spacing={4}>
            <box margin-bottom={4}>
                <label className="header" label="设置" />
                <box hexpand={true} />
                <icon icon="view-more-symbolic" />
            </box>

            <box hexpand={true} spacing={4}>
                <icon icon={bind(wp?.audio.defaultSpeaker!, "volumeIcon")} />
                <label className="settings-entry-label" label="音量" />
                <label className="settings-entry-status" label={bind(wp?.audio.defaultSpeaker!, "description")} ellipsize={Pango.EllipsizeMode.END} />
                <label className="settings-entry-status" label={bind(wp?.audio.defaultSpeaker!, "volume").as((vol) => Math.round(vol * 99) + "%")} />
            </box>
            <slider
                value={bind(wp?.audio.defaultSpeaker!, "volume")}
                setup={(self) => {
                    self.min = 0.0
                    self.max = 1.0
                    self.value = wp?.audio.defaultSpeaker.volume!

                }}
                onDragged={(self) => {
                    wp?.audio.defaultSpeaker.set_volume(self.value)
                }}
            />

            <button className="settings-entry">
                <box hexpand={true} spacing={4}>
                    <icon icon="network-wireless-symbolic" />
                    <label className="settings-entry-label" label="网络" />
                    <label className="settings-entry-status" label="已连接Wifi" ellipsize={Pango.EllipsizeMode.END} />
                    <box hexpand={true} />
                    <icon icon="go-next-symbolic" />
                </box>
            </button>
            <button className="settings-entry">
                <box spacing={4}>
                    <icon icon="bluetooth-active-symbolic"/>
                    <label className="settings-entry-label" label="蓝牙" />
                    <label className="settings-entry-status" label="未连接设备" ellipsize={Pango.EllipsizeMode.END} />
                    <box hexpand={true} />
                    <icon icon="go-next-symbolic"/>
                </box>
            </button>
            <button className="settings-entry">
                <box spacing={4}>
                    <icon icon="display-brightness-symbolic"/>
                    <label className="settings-entry-label" label="显示亮度" />
                    <label className="settings-entry-status" label="80%" ellipsize={Pango.EllipsizeMode.END} />
                    <box hexpand={true} />
                    <icon icon="go-next-symbolic"/>
                </box>
            </button>
            <button className="settings-entry">
                <box spacing={4}>
                    <icon icon="night-light-symbolic"/>
                    <label className="settings-entry-label" label="夜览" />
                    <label className="settings-entry-status" label="已启用wlsunset" ellipsize={Pango.EllipsizeMode.END} />
                    <box hexpand={true} />
                    <icon icon="go-next-symbolic"/>
                </box>
            </button>
            <button className="settings-entry">
                <box spacing={4}>
                    <icon icon="package-x-generic-symbolic"/>
                    <label className="settings-entry-label" label="系统升级" />
                    <label className="settings-entry-status" label="pacman: 无更新" ellipsize={Pango.EllipsizeMode.END} />
                    <box hexpand={true} />
                    <icon icon="go-next-symbolic"/>
                </box>
            </button>
        </box>
    </window>
}