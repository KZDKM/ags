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

const time = Variable<string>("").poll(1000, 'date "+%B %d %A %H:%M:%S"')
const anyMediaPlaying: Variable<boolean> = Variable(false)

const UpdatePlaybackStatus = () => {
  for (const player of mpris.get_players()) {
    if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING) {
      anyMediaPlaying.set(true)
      return
    }
  }
  anyMediaPlaying.set(false)
}


// just a system badge like macOS
function SystemIcon(): JSX.Element {
  return <button
  css="padding: 0;"
  >
    <icon icon="linux"/>
  </button>
}

// App icon and name
function AppBadge(): JSX.Element {

  return <box
    className="appbadge"
  >
    <icon
      css="font-size:12px"
      icon={bind(hyprland, "focusedClient").as((client) => {
        if (client == null) return ""
        const curAppInfo = GetAppInfo(client.get_class())
        return client.get_class() == "" ? "" :
          curAppInfo?.get_string("Icon") ?? "application-x-executable" // default icon
      })}
      visible={bind(hyprland, "focusedClient").as((client) => {
        if (client == null) return false
        const curAppInfo = GetAppInfo(client.get_class())
        return client.get_class() != "" && curAppInfo != undefined
      })}
    />
    <label
      label={bind(hyprland, "focusedClient").as((client) => {
        if (client == null) return "桌面"
        const curAppInfo = GetAppInfo(client.get_class())
        return client.get_class() == "" ? "桌面" : curAppInfo?.get_name() ?? client.get_class()
      })}  
    />
  </box> 
}

function WindowTitle(): JSX.Element {
  return <label
    className="windowtitle"
    truncate={true}
    setup={(self) => {
      hyprland.connect("event", (hyprland, event, args) => {
        if (hyprland.focusedClient != null) {
          self.label = hyprland.focusedClient.title
          bind(hyprland.focusedClient, "title").subscribe((title) => { self.label = title })
        }
        self.visible = hyprland.focusedClient != null
      })
    }}
  >

  </label>
}

function WindowGroup(): JSX.Element {
  return <box
    className="windowgroup"
  >
    <AppBadge />
    <WindowTitle />

  </box>
}

function WorkspaceIndicator(): JSX.Element {
  const windowStatus: Variable<string> = Variable("")
  hyprland.connect("event", () => {  
    if (hyprland.focusedClient == null) return
    for (const client of hyprland.get_clients()) {
      if (client.address == hyprland.focusedClient.address) {
        if (client.fullscreen) windowStatus.set("")
        else if (client.floating) windowStatus.set("")
        else windowStatus.set("")
        break;
      }
    }
  })
  const workspaceToLeft = Variable(false)
  const workspaceToRight = Variable(false)
  return <box
    className="workspaceindicator"
  > 
    <box
      className="workspacepointer" // left pointer
      spacing={2}
      visible={workspaceToLeft()}
    >
      <icon css="font-size: 10px" icon="go-previous"/>
      <label
        className="preceedingws"
        label={bind(hyprland, "focusedWorkspace").as((focusedWorkspace) => {
          let preceedingWSCount = 0
          for (const workspace of hyprland.get_workspaces()) {
            if (
              workspace.monitor.id == focusedWorkspace.monitor.id &&
              workspace.id < focusedWorkspace.id &&
              workspace.get_clients().length > 0
            ) {
              preceedingWSCount++
            }
          }
          if (preceedingWSCount == 0) workspaceToLeft.set(false)
          else workspaceToLeft.set(true)
          return (preceedingWSCount > 9 ? 9 : preceedingWSCount).toString() +
                (preceedingWSCount > 9 ? "+" : "");
        })}
      />
    </box>

    <box
      className="workspacecenter"
    >
      <label
        className="windowindicator"
        css="min-width: 1.2em"
        label={windowStatus()}
        visible={bind(hyprland, "focusedClient").as((client) => (client?.get_class() ?? "") != "")}
      />
      <AppBadge/>
    </box>

    <box
      className="workspacepointer"
      spacing={2}
      visible={workspaceToRight()}
    >
      <label
        className="succeedingws"
        label={bind(hyprland, "focusedWorkspace").as((focusedWorkspace) => {
          let succeedingWSCount = 0
          for (const workspace of hyprland.get_workspaces()) {
            if (
              workspace.monitor.id == focusedWorkspace.monitor.id &&
              workspace.id > focusedWorkspace.id &&
              workspace.get_clients().length > 0
            ) {
              succeedingWSCount++
            }
          }
          if (succeedingWSCount == 0) workspaceToRight.set(false)
          else workspaceToRight.set(true)
          return (succeedingWSCount > 9 ? 9 : succeedingWSCount).toString() +
            (succeedingWSCount > 9 ? "+" : "");
        })}
      />
      <icon css="font-size: 10px" icon="go-next"/>
    </box>

  </box>
}

function Mpris(): JSX.Element {
  return <button
    className={anyMediaPlaying() ? "mpris-active" : "mpris"}
    visible={anyMediaPlaying()}
    onClicked={() => {
      for (const player of mpris.get_players()) {
        if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING) player.play_pause()
      }
    }}
  >
    <icon icon="media-playback-start"/>
  </button>
}

function Bluetooth(): JSX.Element {
  return <box>
    {bind(tray, "items").as((items) => {
      const bluemanItem = items.find((i) => i.id == "blueman")
      const bluemanMenu = bluemanItem?.create_menu()
      return <button
        onClick={(self, event) => {
          if (event.button == Astal.MouseButton.PRIMARY) {
            bluemanMenu?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null)
          }
        }}
        setup={() => execAsync("blueman-applet")}
      >
        <icon
          iconSize={12}
          icon={bind(bluetooth, "isPowered").as((on) =>
            `bluetooth-${on ? "active" : "disabled"}-symbolic`)
          }
        />
      </button>
    })}
    
  </box>
  
}

function Network(): JSX.Element {
  const WifiIndicator = () => <box name="wifi">
    <icon
      iconSize={12}
      icon={bind(network.wifi, "iconName")}
    />
  </box>
  const WiredIndicator = () => <box name="wired">
    <icon
      iconSize={12}
      icon={bind(network.wired, "iconName")}
    />
  </box>


  return <box>
    {bind(tray, "items").as((items) => {
      const nmappletItem = items.find((i) => i.id == "nm-applet") 
      const nmappletMenu = nmappletItem?.create_menu()
      return <button
        onClick={(self, event) => {
          if (event.button == Astal.MouseButton.PRIMARY) {
            nmappletMenu?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null)
          }
        }}
        setup={() => execAsync("nm-applet")}
      >
        <stack
          shown={bind(network,"primary").as((p) => (p == AstalNetwork.Primary.WIFI) ? "wifi" : "wired")}
        >
          <WifiIndicator/>
          <WiredIndicator/>
        </stack>
      </button>
    })}
    
  </box> 
}

function Audio(): JSX.Element {
  return <button
    onClick={(_, event) => {
      if (event.button == Astal.MouseButton.PRIMARY) {
        //toggle player panel
      } else if (event.button == Astal.MouseButton.SECONDARY) {
        execAsync("pwvucontrol")
      }
    }}
    onScroll={(_, event) => {
      if (event.delta_y < 0) {
        wp?.audio.defaultSpeaker.set_volume(wp?.audio.defaultSpeaker.volume + 0.01)
      } else if (event.delta_y > 0) {
        wp?.audio.defaultSpeaker.set_volume(wp?.audio.defaultSpeaker.volume - 0.01)
      }
    }}
  >
    <box
      spacing={4}
      css="margin:0;padding:0"
    >
      <icon
        iconSize={12}
        icon={bind(wp?.audio.defaultSpeaker!, "volumeIcon")}
      />
      <label
        css="font-size: 9px"
        label={bind(wp?.audio.defaultSpeaker!, "volume").as((vol) => Math.round(vol * 99) + "%")}
      />
    </box>
  </button>
}

function Battery(): JSX.Element {
  return <box
    className="battery-container"
    visible={bind(battery, "isPresent")}
  >
    <box
      className={bind(battery, "charging").as((charging) =>
        (battery.percentage <= 15 && !charging) ? "battery-low" : "battery"
      )}
      spacing={2}
    >
      <label
        css="font-size: 10px"
        label={bind(battery, "percentage").as((percentage) => percentage + "%")}
      />
      <icon
        iconSize={12}
        icon={bind(battery, "iconName")}
      />
    </box>
  </box>
}

function MediaGroup(): JSX.Element {
  const UpdatePlaybackStatus = () => {
    for (const player of mpris.get_players()) {
      if (player.playbackStatus == AstalMpris.PlaybackStatus.PLAYING) {
        anyMediaPlaying.set(true)
        return
      }
    }
    anyMediaPlaying.set(false)
  }
  return <box
    className={anyMediaPlaying().as((playing) => playing ? "media-active" : "media")}
    spacing={0}
    setup={(self) => {
      for (const player of mpris.get_players()) {
        bind(player, "playbackStatus").subscribe(UpdatePlaybackStatus)
      }
      mpris.connect("player-added", (_, player) => {
        bind(player, "playbackStatus").subscribe(UpdatePlaybackStatus)
      })
    }}
  >
    <Mpris/>
    <Audio/>
  </box>
}

function Settings(): JSX.Element {
  return <box
    spacing={0}
    className="settings"
  >
    <Bluetooth/>
    <Network />
    <MediaGroup />
    <Battery />
  </box>
}

function Tray(): JSX.Element {
  return <box
    spacing={4}
    className="tray"
  >
    {bind(tray, "items").as(items => items.reverse().filter((i) => i.id != "nm-applet" && i.id != "blueman").map(item => {
      if (item.iconThemePath)
        App.add_icons(item.iconThemePath)
      const menu = item.create_menu()
      return <button
        tooltipMarkup={bind(item, "tooltipMarkup")}
        onDestroy={() => menu?.destroy()}
        onClick={(self, event) => {
            if (event.button == Astal.MouseButton.PRIMARY) {
              item.activate(event.x, event.y)
            } else if (event.button == Astal.MouseButton.SECONDARY) {
              menu?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null)
            }
          }
        }
      >
        <icon
          gIcon={bind(item, "gicon")}
        />
      </button>
    }))}
  </box>
}

function Clock(): JSX.Element {
  return <label
    className="clock"
    yalign={0.5}
    label={time()}
  />
}

function Notifications(): JSX.Element {
  return <button css="margin: 0; padding:0">
    <icon icon="list-ul"/>
  </button>
}

function LeftModules(): JSX.Element {
  return <box
    spacing={8}
    halign={Gtk.Align.START}
  >
    <SystemIcon/>
    <WorkspaceIndicator/>        
    <WindowTitle/>
  </box>
}

function RightModules(): JSX.Element {
  return <box
    halign={Gtk.Align.END}
    spacing={8}
  >
    <Tray />
    <Settings />
    <Clock />
    <Notifications />
  </box>
}

export default function Bar(monitor: Gdk.Monitor) {

    return <window
        name={"bar-" + monitor}
        className="bar"
        namespace="bar"
        layer={Astal.Layer.TOP}
        margin={0 | 0}
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={Astal.WindowAnchor.TOP
            | Astal.WindowAnchor.LEFT
            | Astal.WindowAnchor.RIGHT}
        application={App}>
        <centerbox
            css="min-height: 28px; padding: 0 1em;"
            vexpand={true}
        >
            <LeftModules />
            <box css="min-width: 250px;"/>
            <RightModules />
        </centerbox>
    </window>
}
