import { Bar } from "./bar.js"
import { NotificationPopups } from "./notifications.js"
import { applauncher } from "./applauncher.js"
import { Media } from "./player.js"
import { Wallpaper } from "./wallpaper.js"

App.config({
    style: './style.css',
    windows: [
        //Wallpaper(),
        Bar(),
        NotificationPopups(),
        applauncher,
        Media()
    ]
})