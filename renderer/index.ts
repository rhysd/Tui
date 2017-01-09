import {ipcRenderer as ipc} from 'electron';
import WebView from './webview';
import {DEFAULT_HOME_URL, IS_DEBUG} from './constants';
import log from './log';

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    const wv = new WebView();
    wv.mountTo(document.getElementById('webview-container')!);
    wv.openURL(DEFAULT_HOME_URL).then(() => {
        if (IS_DEBUG) {
            wv.contents.openDevTools({mode: 'detach'});
        }
    });
});

