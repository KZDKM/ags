
export function Wallpaper() {
    return Widget.Window({
        name: "background",
        anchor: ["top", "bottom", "left", "right"],
        keymode: "none",
        layer: "background",
        child: Widget.Box({
            css: "background-image: url('.config/ags/bg/abstract8.jpg'); background-size:cover;"
        })
    })
}