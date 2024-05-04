
export function Wallpaper() {
    return Widget.Window({
        name: "background",
        anchor: ["top", "bottom", "left", "right"],
        keymode: "none",
        layer: "background",
        exclusivity: "ignore",
        child: Widget.Box({
            vexpand: true,
            hexpand: true,
            css: "background-image: url('" + App.configDir + "/../../图片/abstract-bg/abstract8.jpg'); background-size:cover;"
        })
    })
}