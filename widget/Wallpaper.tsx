import { Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";

export default function Wallpaper(monitor: Gdk.Monitor) {
  return (
    <window
      name={"background-" + monitor}
      application={App}
      gdkmonitor={monitor}
      margin={0 | 0}
      layer={Astal.Layer.BACKGROUND}
      keymode={Astal.Keymode.NONE}
      anchor={
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT |
        Astal.WindowAnchor.BOTTOM
      }
      exclusivity={Astal.Exclusivity.IGNORE}
    >
      <box
        vexpand={true}
        hexpand={true}
        css={
          "background-image: url('/home/kzdkm/图片/earth.jpg'); background-size:cover"
        }
      ></box>
    </window>
  );
}
