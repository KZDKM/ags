import { Bar } from "./bar.js";
import { NotificationPopups } from "./notifications.js";
import { applauncher } from "./applauncher.js";
import { Media } from "./player.js";
import { Wallpaper } from "./wallpaper.js";
import { Dock, dockActivator } from "./dock.js";

App.config({
  style: "./style.css",
  windows: [
    Wallpaper(0),
    Wallpaper(1),
    Bar(),
    NotificationPopups(),
    applauncher,
    Dock({ vertical: false }),
    Media(),
  ],
});
