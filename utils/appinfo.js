
import Gio from 'gi://Gio';

// NOTE: this is essentially same as the list provided by the application service
// except that it ignores the hidden state of the desktop entry
// this is needed as the app badge should be able to find the app info regardless if its desktop entry is hidden or not
// TODO: update
const appList = Gio.AppInfo.get_all()
    .map(app => Gio.DesktopAppInfo.new(app.get_id() || ''))
    .filter(app => app)

// app id is synonymous to wm_class
export function GetAppInfo(appID) {
    return appList.find(info => {
        return info.get_id()?.substring(0, info.get_id()?.lastIndexOf('.')) == appID
            || info.get_id()?.substring(0, info.get_id()?.lastIndexOf('.')) == appID.substring(appID.lastIndexOf('.') + 1)
            || info.get_id()?.substring(0, info.get_id()?.lastIndexOf('.')).substring(0, info.get_id()?.indexOf('-')) == appID
            || info.get_startup_wm_class() == appID
            || (info.get_executable() == appID && info.get_executable() != "steam")
    })
}