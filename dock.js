

import Gio from 'gi://Gio';

const hyprland = await Service.import('hyprland')

const appList = Gio.AppInfo.get_all()
    .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
    .filter(app => app)

function dockIcon(client) {
    const curAppInfo = appList.find(info => { return info.get_id()?.replace('.desktop', '') == client.class || info.get_startup_wm_class() == client.class })
    const curIcon = curAppInfo?.get_string('Icon') ?? ""
    return Widget.Box(
        {
            css: "min-height: 42px; min-width: 42px;"
        },
        Widget.Button({
            hpack: "center",
            css: "font-size: 42px;",
            child: Widget.Icon({ icon: curIcon }),
        })
    )
}

function DockApps() {
    return Widget.CenterBox({
        css: "min-height: 50px; min-width: 10px",
        centerWidget: Widget.Box({
            class_name: "dockcontainer",
            children: hyprland.bind('clients').as(i => i.map(dockIcon))
        })
    })
}

export function Dock() {

    return Widget.Window({
        name: "dock",
        class_name: "dock",
        anchor: ["bottom"],
        child: DockApps()
    })
}