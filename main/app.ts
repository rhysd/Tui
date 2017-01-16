import * as path from 'path';
import {
    app,
    globalShortcut,
    BrowserWindow,
    Tray,
} from 'electron';
import * as menubar from 'menubar';
import TrayNotification from './tray_notification';
import AccountSwitcher from './account_switcher';
import log from './log';

import windowState = require('electron-window-state');

const IS_DEBUG = process.env.NODE_ENV === 'development';
const IS_DARWIN = process.platform === 'darwin';
const HTML = `file://${path.join(__dirname, '..', 'renderer', 'index.html')}`;
const APP_ICON = path.join(__dirname, '..', 'resources', 'icon.png');
const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 400;

function trayIcon(color: string) {
    return path.join(__dirname, '..', 'resources', `tray-icon-${
        color === 'white' ? 'white' : 'black'
    }@2x.png`);
}

export default class MainApp {
    win: Electron.BrowserWindow | null = null;
    switcher: AccountSwitcher | null = null;
    notification: TrayNotification | null = null;

    constructor(private readonly config: Config) {
    }

    start() {
        const openWindow = this.config.normal_window ? this.startNormalWindow : this.startMenuBar;
        return openWindow()
            .then(this.setupAccountSwitcher)
            .then(() => {
                if (IS_DARWIN && process.argv[0].endsWith('Electron')) {
                    app.dock.setIcon(APP_ICON);
                }
                return this;
            });
    }

    private startMenuBar = () => {
        log.debug('Setup a menubar window');
        return new Promise<void>(resolve => {
            const state = windowState({
                defaultWidth: DEFAULT_WIDTH,
                defaultHeight: DEFAULT_HEIGHT,
            });
            log.debug('Will launch application:', HTML);
            const icon = trayIcon(this.config.icon_color);
            const mb = menubar({
                index: HTML,
                icon,
                width: state.width,
                height: state.height,
                alwaysOnTop: IS_DEBUG || !!this.config.always_on_top,
                tooltip: 'Tui',
                showDockIcon: true,
            });
            mb.once('ready', () => mb.showWindow());
            mb.once('after-create-window', () => {
                log.debug('Menubar application was launched');
                if (this.config.hot_key) {
                    // XXX: This should be done once
                    globalShortcut.register(this.config.hot_key, () => {
                        if (mb.window.isFocused()) {
                            log.debug('Toggle window: shown -> hidden');
                            mb.hideWindow();
                        } else {
                            log.debug('Toggle window: hidden -> shown');
                            mb.showWindow();
                        }
                    });
                    log.debug('Hot key was set to:', this.config.hot_key);
                }
                if (IS_DEBUG) {
                    mb.window.webContents.openDevTools({mode: 'detach'});
                }
                mb.window.webContents.on('dom-ready', () => {
                    log.debug('Send config to renderer procress');
                    mb.window.webContents.send('tuitter:config', this.config);
                });
                state.manage(mb.window);
                this.notification = new TrayNotification(mb.tray, icon);

                this.win = mb.window;
                resolve();
            });
        });
    }

    private startNormalWindow = () => {
        log.debug('Setup a normal window');
        return new Promise<void>(resolve => {
            const state = windowState({
                defaultWidth: 600,
                defaultHeight: 800,
            });
            const win = new BrowserWindow({
                width: state.width,
                height: state.height,
                x: state.x,
                y: state.y,
                icon: APP_ICON,
                show: false,
                useContentSize: true,
            });
            win.once('ready-to-show', () => {
                win.show();
            });

            if (state.isFullScreen) {
                win.setFullScreen(true);
            } else if (state.isMaximized) {
                win.maximize();
            }
            win.loadURL(HTML);
            state.manage(win);

            const toggleWindow = () => {
                if (win.isFocused()) {
                    log.debug('Toggle window: shown -> hidden');
                    if (IS_DARWIN) {
                        app.hide();
                    } else {
                        win.hide();
                    }
                } else {
                    log.debug('Toggle window: hidden -> shown');
                    win.show();
                }
            };

            win.webContents.on('dom-ready', () => {
                log.debug('Send config to renderer procress');
                win.webContents.send('tuitter:config', this.config);
            });
            win.webContents.once('dom-ready', () => {
                log.debug('Normal window application was launched');
                if (this.config.hot_key) {
                    // XXX: This should be done once
                    globalShortcut.register(this.config.hot_key, toggleWindow);
                    log.debug('Hot key was set to:', this.config.hot_key);
                }
                if (IS_DEBUG) {
                    win.webContents.openDevTools({mode: 'detach'});
                }
                this.win = win;
                resolve();
            });

            const normalIcon = trayIcon(this.config.icon_color);
            const tray = new Tray(normalIcon);
            tray.on('click', toggleWindow);
            tray.on('double-click', toggleWindow);
            if (IS_DARWIN) {
                tray.setHighlightMode('never');
            }
            this.notification = new TrayNotification(tray, normalIcon);
        });
    }

    private setupAccountSwitcher = () => {
        if (!this.config.accounts || this.config.accounts.length === 0) {
            return;
        }
        if (this.win === null) {
            log.error('Cannot setup account switcher because Window is null');
            return;
        }
        this.switcher = new AccountSwitcher(this.win, this.config.accounts);
        this.switcher.on('will-switch', () => {
            if (this.notification === null) {
                log.error('Cannot reset notification state on switching account because no notification instance found (bug)');
                return;
            }
            this.notification.reset();
        });
    }
}
