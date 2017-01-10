import {ipcRenderer as ipc} from 'electron';
import WebView from './webview';
import {DEFAULT_HOME_URL, IS_DEBUG} from './constants';
import KeymapsForwarder from './keymaps_forwarder';
import log from './log';

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    const wv = new WebView();
    wv.mountTo(document.getElementById('webview-container')!);
    wv.openURL(DEFAULT_HOME_URL).then(() => {
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
    });
});

