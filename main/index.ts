import * as path from 'path';
import {
    app,
    globalShortcut,
    BrowserWindow,
    Tray,
} from 'electron';
import * as menubar from 'menubar';
import windowState = require('electron-window-state');
import loadConfig from './config';
import log from './log';
import manageTrayIconState from './tray_icon_state';

const IS_DEBUG = process.env.NODE_ENV === 'development';
const HTML = `file://${path.join(__dirname, '..', 'renderer', 'index.html')}`;
const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 400;

const appReady = new Promise<void>(resolve => app.once('ready', resolve));

process.on('unhandledRejection', (reason: string) => {
    log.error('FATAL: Unhandled rejection! Reason:', reason);
});

app.on('will-quit', () => {
    log.debug('Application is quitting');
});

function trayIcon(color: string) {
    return path.join(__dirname, '..', 'resources', `tray-icon-${
        color === 'white' ? 'white' : 'black'
    }@2x.png`);
}

function startMenuBar(config: Config) {
    log.debug('Setup a menubar window');
    return new Promise<void>(resolve => {
        const state = windowState({
            defaultWidth: DEFAULT_WIDTH,
            defaultHeight: DEFAULT_HEIGHT,
        });
        log.debug('Will launch application:', HTML);
        const mb = menubar({
            index: HTML,
            icon: trayIcon(config.icon_color),
            width: state.width,
            height: state.height,
            alwaysOnTop: IS_DEBUG || !!config.always_on_top,
            tooltip: 'Tui',
        });
        mb.once('ready', () => mb.showWindow());
        mb.once('after-create-window', () => {
            log.debug('Menubar application was launched');
            if (config.hot_key) {
                globalShortcut.register(config.hot_key, () => {
                    if (mb.window.isFocused()) {
                        log.debug('Toggle window: shown -> hidden');
                        mb.hideWindow();
                    } else {
                        log.debug('Toggle window: hidden -> shown');
                        mb.showWindow();
                    }
                });
                log.debug('Hot key was set to:', config.hot_key);
            }
            if (IS_DEBUG) {
                mb.window.webContents.openDevTools({mode: 'detach'});
            }
            mb.window.webContents.on('dom-ready', () => {
                log.debug('Send config to renderer procress');
                mb.window.webContents.send('tuitter:config', config);
            });
            state.manage(mb.window);
            manageTrayIconState(mb.tray, config.icon_color);
            resolve();
        });
    });
}

function startNormalWindow(config: Config) {
    log.debug('Setup a normal window');
    return new Promise<void>(resolve => {
        const state = windowState({
            defaultWidth: 600,
            defaultHeight: 800,
        });
        const icon_path = path.join(__dirname, '..', 'resources', 'icon.png');
        if (process.argv[0].endsWith('Electron') && process.platform === 'darwin') {
            app.dock.setIcon(icon_path);
        }
        const win = new BrowserWindow({
            width: state.width,
            height: state.height,
            x: state.x,
            y: state.y,
            icon: icon_path,
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
                win.hide();
            } else {
                log.debug('Toggle window: hidden -> shown');
                win.show();
            }
        };

        win.webContents.on('dom-ready', () => {
            log.debug('Send config to renderer procress');
            win.webContents.send('tuitter:config', config);
        });
        win.webContents.once('dom-ready', () => {
            log.debug('Normal window application was launched');
            if (config.hot_key) {
                globalShortcut.register(config.hot_key, toggleWindow);
                log.debug('Hot key was set to:', config.hot_key);
            }
            if (IS_DEBUG) {
                win.webContents.openDevTools({mode: 'detach'});
            }
            resolve();
        });

        const tray = new Tray(trayIcon(config.icon_color));
        tray.on('click', toggleWindow);
        tray.on('double-click', toggleWindow);
        if (process.platform === 'darwin') {
            tray.setHighlightMode('never');
        }
        manageTrayIconState(tray, config.icon_color);
    });
}

// Note:
// 'menubar' package internally waits for app being ready.
// But windowState() calls electron.screen internally and it requires
// that app is ready.
Promise.all([loadConfig(), appReady]).then(([c, _]) =>
    c.normal_window ? startNormalWindow(c) : startMenuBar(c)
).then(() => {
    log.debug('Application launched!');
});
