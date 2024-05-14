
const hyprland = await Service.import('hyprland')
import { GetAppInfo } from "./utils/appinfo.js"


function PinnedApps({ vertical = false }) {
    const pinnedBox = Widget.Box({
        vertical: vertical,
    })

    function pinnedApp(app) {
        return Widget.Box({
            css: "margin: 0; padding: 0; min-height: 42px; min-width: 42px;"
        },
            Widget.Button({
                //css: "font-size: 42px;",
                child: Widget.Icon({ size: 42, icon: app?.get_string('Icon') || "application-x-executable" }),
                hpack: "center",
                onPrimaryClick: () => {
                    app?.launch([], null)
                }
            }))
    }

    function updatePinned(file, event) {
        let apps = []
        Utils.readFile(file).split("\n").forEach(value => {
            if (value != "") {
                const curAppInfo = GetAppInfo(value)
                if (curAppInfo)
                    apps.push(curAppInfo)
            }
        })
        
        let pinnedIcons = []
        
        apps.forEach(app => {
            pinnedIcons.push(pinnedApp(app))
        })

        //pinnedIcons.push(Widget.Separator({vertical: !vertical}))

        pinnedBox.children = pinnedIcons
        pinnedBox.visible = apps.length > 0
    }

    Utils.monitorFile(App.configDir + "/../ags-config/pinned-apps", updatePinned)
    updatePinned(App.configDir + "/../ags-config/pinned-apps")

    return pinnedBox
}

function dockIcon(client) {
    const curAppInfo = GetAppInfo(client.class)
    const curIconName = curAppInfo?.get_string('Icon') ?? "application-x-executable"

    const dockMenu = Widget.Menu({
        children: [
            Widget.MenuItem({
                child: Widget.Label("Pin"),
                onActivate: () => {
                    const pinned = Utils.readFile(App.configDir + "/../ags-config/pinned-apps")
                    for (const entry of pinned.split("\n")) {
                        console.log(entry)
                        if (entry == client.class) // dont pin if exists
                            return
                    }
                    Utils.writeFile(pinned + "\n" + client.class, App.configDir + "/../ags-config/pinned-apps")
                }
            })
        ]
    })

    return Widget.Box(
        {
            css: "margin: 0; padding: 0; min-height: 42px; min-width: 42px;"
        },
        Widget.Button({
            hpack: "center",
            //css: "font-size: 42px;",
            child: Widget.Icon({ size: 42, icon: curIconName }),

            // click icon to focus window
            onPrimaryClick: () => {
                Utils.execAsync("hyprctl dispatch focuswindow address:" + client.address)
            },
            onSecondaryClick: (_, event) => {
                dockMenu.popup_at_pointer(event)
            }
        })
    )
}

function UpdateDock(box) {
    const clients = hyprland.clients.sort((a, b) => { return a.workspace.id - b.workspace.id })
    let lastWSID = -1
    let dockWidgets = []
    let workspaceCount = 0
    for (const client of clients) {
        if (client.pinned) continue
        if (client.workspace.id > lastWSID) {
            dockWidgets.push(Widget.Box({class_name: "workspacecontainer"}))
            workspaceCount++
            if (hyprland.active.workspace.id == client.workspace.id) dockWidgets[workspaceCount - 1].class_name = "workspacecontainer-active"
        }
        lastWSID = client.workspace.id
        dockWidgets[workspaceCount - 1].add(dockIcon(client))
    }
    box.children = dockWidgets
}

function DockApps({ vertical = false }) {
    return Widget.Box({
        vertical: vertical,
        //children: hyprland.bind('clients').as(i => i.sort((a, b) => { return a.workspace.id - b.workspace.id }).map(dockIcon))
    }).hook(hyprland, UpdateDock, "event")
}

export function Dock({ vertical = false }) {

    return Widget.Window({
        name: "dock",
        class_name: "dock",
        anchor: [vertical ? "right" : "bottom"],
        layer: "overlay",
        margins: [4, 4],
        child: Widget.CenterBox({
            visible: false,
            css: "min-height: 50px; min-width: 10px",
            centerWidget: Widget.EventBox({
                child: Widget.Box({
                    class_name: "dockcontainer",
                    vertical: vertical
                }, PinnedApps({ vertical: vertical }), DockApps({ vertical: vertical })),
            })
        })
    })
}

export function dockActivator({vertical = false}) {
    return Widget.Window({
        name: "dock_activator",
        css: "background-color: transparent",
        anchor: vertical ? ["right", "top", "bottom"] : ["bottom", "left", "right"],
        keymode: "none",
        exclusivity: "ignore",
        child: Widget.Box({
            css: "min-height: 20px; min-width: 20px",
            child: Widget.EventBox({
                vexpand: true,
                hexpand: true,
                on_hover: () => {
                    App.openWindow("dock")
                }
            })
        })
    })
}