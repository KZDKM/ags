const { query } = await Service.import("applications")
const WINDOW_NAME = "applauncher"

/** @param {import('resource:///com/github/Aylur/ags/service/applications.js').Application} app */
const AppItem = app => Widget.Button({
    class_name: "app",
    on_clicked: () => {
        App.closeWindow(WINDOW_NAME)
        app.launch()
    },
    attribute: { app },
    child: Widget.Box({
        spacing: 8,
        children: [
            Widget.Icon({
                css: "font-size: 42px",
                icon: app.icon_name || "",
            }),
            Widget.CenterBox({
                centerWidget: Widget.Box({
                    spacing: 2,
                    vertical: true,
                    vpack: "center"
                },
                    Widget.Label({
                        class_name: "title",
                        label: app.name,
                        xalign: 0,
                        vpack: "center",
                        truncate: "end",
                    }),
                    Widget.Label({
                        class_name: "description",
                        label: app.description,
                        visible: (app.description ?? "") != "",
                        xalign: 0,
                        vpack: "center",
                        truncate: "end",
                    }),)
            }),
        ],
    }),
})

const Applauncher = ({ width = 500, height = 500, spacing = 12 }) => {
    // list of application buttons
    let applications = query("").map(AppItem)

    // container holding the buttons
    const list = Widget.Box({
        vertical: true,
        children: applications,
        spacing,
    })

    // repopulate the box, so the most frequent apps are on top of the list
    function repopulate() {
        applications = query("").map(AppItem)
        list.children = applications
    }

    // search entry
    const entry = Widget.Entry({
        hexpand: true,
        css: `min-width: ${width}px;`,

        placeholder_text: "搜索",

        // to launch the first item on Enter
        on_accept: () => {
            // make sure we only consider visible (searched for) applications
            const results = applications.filter((item) => item.visible);
            if (results[0]) {
                App.toggleWindow(WINDOW_NAME)
                results[0].attribute.app.launch()
            }
        },

        // filter out the list
        on_change: ({ text }) => applications.forEach(item => {
            item.visible = item.attribute.app.match(text ?? "")
        }),
    })

    return Widget.Box({
        vertical: true,
        css: `margin: ${spacing * 2}px;`,
        children: [
            Widget.Box(
                {},
                Widget.Icon({size: 16, icon: "system-search-symbolic"}),
                entry,
            ),

            // wrap the list in a scrollable
            Widget.Scrollable({
                hscroll: "never",
                css: `min-width: ${width}px;`
                    + `min-height: ${height}px;`
                    + `margin-top: ${spacing * 2}px;`,
                child: list,
            }).hook(entry, self => {
                if ((entry.text ?? "") == "") {
                    self.visible = false
                    return
                }
                self.visible = true
            }, "changed"),
        ],
        setup: self => self.hook(App, (_, windowName, visible) => {
            if (windowName !== WINDOW_NAME)
                return

            // when the applauncher shows up
            if (visible) {
                repopulate()
                entry.text = ""
                entry.grab_focus()
            }
        })
    })
}

// there needs to be only one instance
export const applauncher = Widget.Window({
    name: WINDOW_NAME,
    class_name: WINDOW_NAME,
    setup: self => self.keybind("Escape", () => {
        App.closeWindow(WINDOW_NAME)
    }),
    visible: false,
    keymode: "exclusive",
    child: Applauncher({
        width: 600,
        height: 400,
        spacing: 6,
    }),
})