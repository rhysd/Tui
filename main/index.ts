import * as path from 'path';
import * as menubar from 'menubar';
import {
    app,
    globalShortcut,
    BrowserWindow,
} from 'electron';
import loadConfig from './config';
import log from './log';

const IS_DEBUG = process.env.NODE_ENV === 'development';
const HTML = `file://${path.join(__dirname, '..', 'renderer', 'index.html')}${IS_DEBUG ? '?react_perf' : ''}`;
const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 400;

const appReady = new Promise(resolve => app.on('ready', resolve));

process.on('unhandledRejection', (reason: string) => {
    log.error('FATAL: Unhandled rejection! Reason:', reason);
});

app.on('will-quit', () => {
    log.debug('Application is quitting');
});

function setupMenuBar(config: Config) {
    log.debug('Setup a menubar window');
    return new Promise<Menubar.MenubarApp>(resolve => {
        const icon = path.join(__dirname, '..', 'resources', `tray-icon-${
            config.icon_color === 'white' ? 'white' : 'black'
        }@2x.png`);
        log.debug('Will launch application:', HTML, icon);
        const mb = menubar({
            index: HTML,
            icon,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            alwaysOnTop: IS_DEBUG || !!config.always_on_top,
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
            mb.window.webContents.once('dom-ready', () => {
                mb.window.webContents.send('tuitter:config', config);
            });
            resolve(mb);
        });
    });
}

function setupNormalWindow(config: Config) {
    log.debug('Setup a normal window');
    return new Promise<Electron.BrowserWindow>(resolve => {
        if (process.platform === 'darwin') {
            app.dock.setIcon(path.join(__dirname, '..', 'resources', 'icon', 'app.png'));
        }
        const win = new BrowserWindow({
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            icon: path.join(__dirname, '..', 'resources', 'icon', 'app.png'),
        });
        win.loadURL(HTML);
        win.webContents.once('dom-ready', () => {
            log.debug('Normal window application was launched');
            if (config.hot_key) {
                globalShortcut.register(config.hot_key, () => {
                    if (win.isFocused()) {
                        log.debug('Toggle window: shown -> hidden');
                        win.hide();
                    } else {
                        log.debug('Toggle window: hidden -> shown');
                        win.show();
                    }
                });
                log.debug('Hot key was set to:', config.hot_key);
            }
            win.webContents.send('chromenu:tuitter', config);
            if (IS_DEBUG) {
                win.webContents.openDevTools({mode: 'detach'});
            }
            resolve(win);
        });
    });
}

// Note:
// No need to wait for 'ready' event when launching menubar style application
// because 'menubar' package internally waits for app being ready.
loadConfig().then(
    c => c.normal_window ?
        appReady.then(() => setupNormalWindow(c)) :
        setupMenuBar(c)
).then(() => {
    log.debug('Application launched!');
});
