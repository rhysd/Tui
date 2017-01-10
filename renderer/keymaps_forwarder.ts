import * as Mousetrap from 'mousetrap';
import WebView from './webview';
import log from './log';

export default class KeymapsForwarder {
    constructor(public webview: WebView) {
    }

    forwardAll(config: KeymapsConfig) {
        for (const key in config) {
            this.forward(key, config[key]);
        }
    }

    forward(key: string, name: KeymapName) {
        Mousetrap.bind(key, e => {
            log.debug('Key pressed: ' + key, name);

            if (name === null) {
                return;
            }

            if (e.code === 'Tab') {
                e.preventDefault();
            }

            const channel = `tuitter:keymap:${name}`;
            this.webview.sendIpc(channel);
        });
    }
}
