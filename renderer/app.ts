import * as path from 'path';
import {ipcRenderer as ipc} from 'electron';
import WebView from './webview';
import {DEFAULT_HOME_URL, IS_DEBUG, APP_DIRECTORY} from './constants';
import log from './log';

export default class RendererApp {
    private wv: WebView | null = null;

    constructor(private readonly config: Config) {
        this.switchTo(this.getFirstScreenName());
    }

    switchTo(screenName: string) {
        if (this.wv !== null) {
            this.wv.unmount();
            this.wv = null;
        }

        const wv = new WebView(screenName);
        wv.mountTo(document.getElementById('webview-container')!);
        wv.openURL(this.config.home_url || DEFAULT_HOME_URL).then(() => {
            if (IS_DEBUG) {
                wv.contents.openDevTools({mode: 'detach'});
            }
            if (this.config.zoom_factor && this.config.zoom_factor > 0.0) {
                wv.element.setZoomFactor(this.config.zoom_factor);
            }

            wv.sendIpc('tuitter:plugin-paths', this.config.plugins || []);
            wv.sendIpc('tuitter:keymaps', this.config.keymaps || {});
            log.debug('Have switched to account', wv.screenName);
        });

        wv.on('dom-ready', () => {
            // Apply CSS in order style.css -> theme.css -> user.css
            wv.applyCSS(path.join(__dirname, '../webview/style.css')).catch(e => log.error(e))
            .then(() => wv.applyCSS(path.join(APP_DIRECTORY, 'theme.css'))).catch(e => log.debug(e))
            .then(() => wv.applyCSS(path.join(APP_DIRECTORY, 'user.css'))).catch(e => log.debug(e));

            wv.executeJS(path.join(APP_DIRECTORY, 'user.js')).catch(e => log.debug(e));
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
        this.wv = wv;
    }

    private getFirstScreenName() {
        if (!this.config.accounts || this.config.accounts.length === 0) {
            return 'unknown-user';
        }
        const n = this.config.accounts[0];
        if (n.startsWith('@')) {
            return n.slice(1);
        } else {
            return n;
        }
    }

}
