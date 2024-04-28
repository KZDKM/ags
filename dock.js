

import Gio from 'gi://Gio';

const hyprland = await Service.import('hyprland')

const appList = Gio.AppInfo.get_all()
    .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
    .filter(app => app)


export function Dock() {
    return Widget.Window({
        anchor: ["bottom"], 
    }).hook(hyprland, self => {
        self.get_children().forEach(child => {child.destroy})
        hyprland.clients.forEach(client => { 
            const curAppInfo = appList.find(info => { return info.get_id()?.replace('.desktop', '') == client.class || info.get_startup_wm_class() == client.class })
        })
    })
}