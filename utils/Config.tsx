import { Variable, bind, execAsync } from "astal";
import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import {
  readFile,
  readFileAsync,
  writeFile,
  writeFileAsync,
  monitorFile,
} from "astal/file";

const configPath = "../ags-config/config.json";

export type Config = {
  // name of main monitor
  primaryMonitor: string;
  // path to wallpaper
  wallpaper: string;
  // list of docked apps
  dockedApps: string[];
};

type ConfigCallback = (config: Config) => void;

let callbacks: ConfigCallback[] = [];

let config: Config = {
  primaryMonitor: "",
  wallpaper: "",
  dockedApps: [],
};

// initialize config monitor, should only be called on app initialization
export function configInit() {
  // create default config if it does not exist
  if (readFile(configPath) == "") {
    // TODO
    const initConfig =
      '{"primaryMonitor": "", "wallpaper": "", "dockedApps": []}';
    writeFile(configPath, initConfig);
  }
  monitorFile(configPath, updateConfig);
  updateConfig();
}

function writeConfig() {
  writeFileAsync(configPath, JSON.stringify(config));
}

export function registerConfigCallback(callback: ConfigCallback) {
  callbacks.push(callback);
}

export function updateConfig() {
  const conf = JSON.parse(readFile(configPath));
  config.wallpaper = conf.wallpaper;
  config.primaryMonitor = conf.primaryMonitor;
  config.dockedApps = conf.dockedApps;
  callbacks.forEach((callback) => callback(config));
}

export function dockApp(appName: string) {
  config.dockedApps.push(appName);
  writeConfig();
}

export function undockApp(appName: string) {
  config.dockedApps = config.dockedApps.filter((value) => value != appName);
  writeConfig();
}
