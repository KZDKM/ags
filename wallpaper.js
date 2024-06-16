export function Wallpaper(inMonitor) {
  return Widget.Window({
    monitor: inMonitor,
    name: "background-" + inMonitor,
    anchor: ["top", "bottom", "left", "right"],
    keymode: "none",
    layer: "background",
    exclusivity: "ignore",
    child: Widget.Box({
      vexpand: true,
      hexpand: true,
      css:
        "background-image: url('" +
        App.configDir +
        "/../../图片/abstract-bg/abstract7.jpg'); background-size:cover;",
    }),
  });
}
