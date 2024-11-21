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

const mpris = AstalMpris.get_default()
const hyprland = AstalHyprland.get_default()
const tray = AstalTray.get_default()
const bluetooth = AstalBluetooth.get_default()
const network = AstalNetwork.get_default()
const wp = AstalWp.get_default();
const battery = AstalBattery.get_default();