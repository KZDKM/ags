
import Gio from 'gi://Gio';

const hyprland = await Service.import('hyprland')
const systemtray = await Service.import('systemtray')
//const { query } = await Service.import('applications')
const mpris = await Service.import('mpris')
const audio = await Service.import('audio')
const network = await Service.import('network')
const battery = await Service.import('battery')
const bluetooth = await Service.import('bluetooth')

// NOTE: this is essentially same as the list provided by the application service
// except that it ignores the hidden state of the desktop entry
// this is needed as the app badge should be able to find the app info regardless if its desktop entry is hidden or not
// TODO: update
const appList = Gio.AppInfo.get_all()
    .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
    .filter(app => app)

// just a system badge like macOS
function SystemIcon() {
    return Widget.Button({
        child: Widget.Label({ class_name: 'sysicon', label: '' }),
        on_clicked: () => {
            Utils.execAsync("flatpak run io.missioncenter.MissionCenter")
        }
    })
}

// redundant with overview plugin installed, unused
function Workspaces() {
    const activeId = hyprland.active.workspace.bind("id")
    const workspaces = hyprland.bind("workspaces")
        .as(ws => ws.map(({ id }) => Widget.Button({
            on_clicked: () => hyprland.messageAsync(`dispatch workspace ${id}`),
            child: Widget.Label(`${id}`),
            class_name: activeId.as(i => `${i === id ? "focused" : ""}`),
        })))

    return Widget.Box({
        class_name: "workspaces",
        children: workspaces,
    })
}

// App icon and name
function AppBadge() {
    return Widget.Box({
        class_name: "appbadge",
        children: [
            Widget.Icon().hook(hyprland.active.client, self => {
                const curAppInfo = appList.find(info => { return info.get_id()?.replace('.desktop', '') === hyprland.active.client.class })
                self.icon = (hyprland.active.client.class === "") ?
                    "" :
                    curAppInfo?.get_string('Icon') ?? ""
                self.visible = curAppInfo != undefined
            }),
            Widget.Label().hook(hyprland.active.client, self => {
                const curAppInfo = appList.find(info => { return info.get_id()?.replace('.desktop', '') === hyprland.active.client.class })
                self.label = (hyprland.active.client.class === "") ?
                    "Desktop" :
                    curAppInfo?.get_name() ?? hyprland.active.client.class
            })
        ]
    })
}

function WindowTitle() {
    return Widget.Label({
        class_name: "windowtitle",
        truncate: "end",
        label: hyprland.active.client.bind('title'),
        visible: hyprland.active.client.bind('class').as(c => c !== "")
    })
}

// group of widgets displaying the focused window
function WindowGroup() {
    return Widget.Box({
        class_name: "windowgroup",
        children: [
            AppBadge(),
            WindowTitle()
        ]
    })
}

// includes app icon, app name, window title, window state (float, maximized, etc.)
function WorkspaceIndicator() {
    return Widget.Box({
        class_name: "workspaceindicator",
        children: [
            Widget.Box({
                class_name: "workspacepointer",
                spacing: 2,
                children: [
                    Widget.Label({
                        class_names: ["wsarrows", "texticon"],
                        label: "",
                    }),
                    Widget.Label({ class_name: "preceedingws" }).hook(hyprland, self => {
                        let preceedingWSCount = 0
                        for (const workspace of hyprland.workspaces) {
                            if (workspace.monitorID == hyprland.active.monitor.id
                                && workspace.id < hyprland.active.workspace.id && workspace.windows > 0) {
                                preceedingWSCount++
                            }
                        }
                        self.label = ((preceedingWSCount > 9) ? 9 : preceedingWSCount).toString() + ((preceedingWSCount > 9) ? "+" : "")
                        self.parent.visible = preceedingWSCount > 0
                    }, "event"),
                ]
            }),
            Widget.Box({
                class_name: "workspacecenter",
                children: [
                    Widget.Label({
                        class_name: "windowindicator",
                        css: "min-width: 1.2em",
                        label: "",
                        visible: false
                    }).hook(hyprland, self => {
                        for (const client of hyprland.clients) {
                            if (client.address == hyprland.active.client.address) {
                                if (client.fullscreen)
                                    self.label = ""
                                else if (client.floating)
                                    self.label = ""
                                else
                                    self.label = ""

                                break;
                            }
                        }

                        self.visible = hyprland.active.client.class !== ""

                    }, "event"),
                    AppBadge()
                ]
            }).hook(hyprland, self => {
                self.class_name = "workspacecenter"
                for (const client of hyprland.clients) {
                    if (client.address == hyprland.active.client.address) {
                        if (client.fullscreen) {
                            self.class_name = "workspacecenter-active"
                            return
                        }
                    }
                }
            }),

            Widget.Box({
                class_name: "workspacepointer",
                spacing: 2,
                children: [
                    Widget.Label({ class_name: "succeedingws" }).hook(hyprland, self => {
                        let succeedingWSCount = 0
                        for (const workspace of hyprland.workspaces) {
                            if (workspace.monitorID == hyprland.active.monitor.id
                                && workspace.id > hyprland.active.workspace.id && workspace.windows > 0) {
                                succeedingWSCount++
                            }
                        }
                        self.label = ((succeedingWSCount > 9) ? 9 : succeedingWSCount).toString() + ((succeedingWSCount > 9) ? "+" : "")
                        self.parent.visible = succeedingWSCount > 0
                    }, "event"),
                    Widget.Label({
                        class_names: ["wsarrows", "texticon"],
                        label: "",
                    }),
                ]
            }),
        ]
    })
}

function Mpris() {
    return Widget.Button({
        class_names: ["texticon", "mpris"], on_clicked: () => {
            // pause all
            for (const player of mpris.players) {
                if (player.play_back_status === "Playing")
                    player.playPause()
            }
        }
    }).hook(mpris, self => {
        let isPlaying = false
        for (const player of mpris.players) {
            if (player.play_back_status === "Playing") {
                isPlaying = true
                break;
            }
        }
        self.visible = isPlaying;
        self.label = ""
        self.class_names = ["texticon", isPlaying ? "mpris-active" : "mpris"]
    }, "changed")
}

function Tray() {
    const trayItem = item => Widget.Button({
        child: Widget.Icon().bind('icon', item, 'icon'),
        tooltip_markup: item.bind('tooltip_markup'),
        onPrimaryClick: (_, event) => item.activate(event),
        onSecondaryClick: (_, event) => item.openMenu(event),
    })
    return Widget.Box({
        spacing: 4,
        class_name: "tray",
        children: systemtray.bind('items').as(i => i.map(trayItem))
    })
}

function Bluetooth() {

    return Widget.Button({
        child: Widget.Icon({
            size: 12,
            icon: bluetooth.bind('enabled').as(on =>
                `bluetooth-${on ? 'active' : 'disabled'}-symbolic`),
        })
    })
}

function Network() {
    const WifiIndicator = () => Widget.Box({
        children: [
            Widget.Icon({
                size: 12,
                icon: network.wifi.bind('icon_name'),
            }),
            /*Widget.Label({
                label: network.wifi.bind('ssid')
                    .as(ssid => ssid || 'Unknown'),
            }),*/
        ],
    })

    const WiredIndicator = () => Widget.Icon({
        size: 12,
        icon: network.wired.bind('icon_name'),
    })

    return Widget.Button({
        child: Widget.Stack({
            children: {
                wifi: WifiIndicator(),
                wired: WiredIndicator(),
            },
            shown: network.bind('primary').as(p => p || 'wifi'),
        })
    })
}

function Audio() {
    return Widget.Button({
        on_primary_click: () => {
            App.ToggleWindow("players")
        },
        on_secondary_click: () => {
            Utils.execAsync("pavucontrol")
        },
        on_scroll_down: () => audio.speaker.volume -= 0.01,
        on_scroll_up: () => audio.speaker.volume += 0.01,
        child: Widget.Box({
            spacing: 2,
            children: [
                Widget.Label({ css: "font-size:10px;" }).hook(audio.speaker, self => {
                    const vol = audio.speaker.volume * 100;
                    self.label = Math.round(vol).toString() + "%"
                }),
                Widget.Icon({ size: 12 }).hook(audio.speaker, self => {
                    const vol = audio.speaker.volume * 100
                    const icon = [
                        [101, 'overamplified'],
                        [67, 'high'],
                        [34, 'medium'],
                        [1, 'low'],
                        [0, 'muted'],
                    ].find(([threshold]) => threshold <= vol)?.[1]

                    self.icon = `audio-volume-${icon}-symbolic`
                    self.tooltip_text = `Volume ${Math.round(vol)}%`
                })]
        }),
    })
}

function Battery() {
    return Widget.Box({
        visible: battery.bind('available'),
        child: Widget.Box({
            class_name: battery.bind('percent').as(percent => (percent <= 15) ? "battery-low" : "battery"),
            spacing: 2,
            children: [
                Widget.Label({
                    css: 'font-size: 10px;',
                    label: battery.bind('percent').as(percent => percent + "%")
                }),
                Widget.Icon({
                    size: 12,
                    icon: battery.bind('icon_name')
                }),
            ]
        }),
        class_name: "battery-container",
    })
}

function MediaGroup() {
    return Widget.Box({
        class_name: "media",
        spacing: 0,
        children: [
            Mpris(),
            Audio()
        ]
    }).hook(mpris, self => {
        let isPlaying = false
        for (const player of mpris.players) {
            if (player.play_back_status === "Playing") {
                isPlaying = true
                break;
            }
        }
        self.class_name = isPlaying ? "media-active" : "media"
    }, "changed")
}

// all system related widgets
function Settings() {

    return Widget.Box({
        spacing: 0,
        class_name: "settings"
    },
        Bluetooth(),
        Network(),
        MediaGroup(),
        Battery(),
    )

}

function Clock() {
    const time = Variable("", { poll: [1000, 'date "+%B %d %A %H:%M"'], })
    return Widget.Label({
        class_name: "clock",
        yalign: 0.5,
        label: time.bind()
    })
}

function LeftModules() {
    return Widget.Box({
        hpack: 'start', spacing: 8, children: [
            SystemIcon(),
            WorkspaceIndicator(),
            WindowTitle()
            //WindowGroup()
        ]
    })
}

function RightModules() {
    return Widget.Box({
        hpack: 'end', spacing: 8, children: [
            Tray(),
            Settings(),
            Clock()
        ]
    })
}

export function Bar() {
    return Widget.Window({
        name: 'bar',
        class_name: 'bar',
        exclusivity: 'exclusive',
        margins: [0, 0],
        anchor: ['top', 'left', 'right'],
        child: Widget.CenterBox({
            css: "min-height: 38px; padding: 0 1em;",
            start_widget: LeftModules(),
            end_widget: RightModules(),
            center_widget: Widget.Box({css:"min-width: 250px;"})
        })
    })
}