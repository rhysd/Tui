import * as path from 'path';
import {ipcRenderer as ipc, remote} from 'electron';
import WebView from './webview';
import {DEFAULT_HOME_URL, IS_DEBUG} from './constants';
import KeymapsForwarder from './keymaps_forwarder';
import log from './log';

function getScreenName(config: Config) {
    if (!config.accounts || config.accounts.length === 0) {
        return 'unknown-user';
    }
    const n = config.accounts[0];
    if (n.startsWith('@')) {
        return n.slice(1);
    } else {
        return n;
    }
}

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    const wv = new WebView(getScreenName(config));
    wv.mountTo(document.getElementById('webview-container')!);
    wv.openURL(config.home_url || DEFAULT_HOME_URL).then(() => {
        if (IS_DEBUG) {
            wv.contents.openDevTools({mode: 'detach'});
        }
        if (config.zoom_factor && config.zoom_factor > 0.0) {
            wv.element.setZoomFactor(config.zoom_factor);
        }
        if (config.keymaps) {
            const forwarder = new KeymapsForwarder(wv);
            forwarder.forwardAll(config.keymaps);
        }

        wv.applyCSS(path.join(__dirname, '../webview/style.css')).catch(e => log.error(e));
        const user_css = path.join(remote.app.getPath('userData'), 'user.css');
        wv.applyCSS(user_css).catch(e => log.debug(e));
        const user_js = path.join(remote.app.getPath('userData'), 'user.js');
        wv.executeJS(user_js).catch(e => log.debug(e));
        wv.sendIpc('tuitter:plugin-paths', config.plugins || []);
    });
    wv.on('ipc', (channel: string) => {
        switch (channel) {
            case 'tuitter:notified:mentions': {
                ipc.send('tuitter:tray:informed');
                break;
            }
            case 'tuitter:notified:messages': {
                ipc.send('tuitter:tray:notified');
                break;
            }
            case 'tuitter:un-notified:mentions':
            case 'tuitter:un-notified:messages': {
                ipc.send('tuitter:tray:normal');
                break;
            }
            default: break;
        }
    });
});
