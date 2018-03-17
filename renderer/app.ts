import * as path from 'path';
import { ipcRenderer as ipc } from 'electron';
import WebView from './webview';
import { DEFAULT_HOME_URL, IS_DEBUG, APP_DIRECTORY } from './constants';
import log from './log';

export default class RendererApp {
    private wv: WebView;

    constructor(private readonly config: Config) {
        this.switchTo(this.getFirstScreenName());

        // After hiding window, <webview> loses its focus.
        // So when window is shown again, need to give <webview> focus again.
        // Note:
        // remove.getCurrentWindow().on('focus', ...) is unavailable
        // because callback remains after this web contents reloaded.
        // Remained callback causes a 'trying to send message to removed web contents'
        // error.
        ipc.on('tuitter:window-focused', () => this.wv.focus());
        ipc.on('tuitter:menu:new-tweet', () => this.wv.sendIpc('tuitter:new-tweet'));
        ipc.on('tuitter:will-suspend', (__: any, threshold: number) => {
            log.debug('Refresh app because system will be suspended. Threshold:', threshold, this.wv);
            this.wv.sendIpc('tuitter:will-suspend', threshold);
        });
    }

    switchTo(screenName: string) {
        if (this.wv && this.wv.isMounted) {
            this.wv.unmount();
        }

        this.wv = new WebView(screenName);
        this.wv.mountTo(document.getElementById('webview-container')!);
        this.wv.openURL(this.config.home_url || DEFAULT_HOME_URL).then(() => {
            if (IS_DEBUG) {
                this.wv.contents.openDevTools({ mode: 'detach' });
            }
            if (this.config.zoom_factor && this.config.zoom_factor > 0.0) {
                this.wv.element.setZoomFactor(this.config.zoom_factor);
            }

            log.debug('Have switched to account', this.wv.screenName);
        });

        this.wv.on('dom-ready', () => {
            // Apply CSS in order style.css -> theme.css -> user.css
            this.wv
                .applyCSS(path.join(__dirname, '../webview/style.css'))
                .catch(e => log.error(e))
                .then(() => this.wv.applyCSS(path.join(APP_DIRECTORY, 'theme.css')))
                .catch(e => log.debug(e))
                .then(() => this.wv.applyCSS(path.join(APP_DIRECTORY, 'user.css')))
                .catch(e => log.debug(e));

            this.wv.executeJS(path.join(APP_DIRECTORY, 'user.js')).catch(e => log.debug(e));
            this.wv.sendIpc('tuitter:plugin-paths', this.config.plugins || []);
            this.wv.sendIpc('tuitter:keymaps', this.config.keymaps || {});
            log.debug('DOM in <webview> is ready. Preprocess was done.');
        });

        this.wv.on('ipc', (channel: string, args: any[]) => {
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
                case 'tuitter:refresh-me': {
                    log.debug('Refresh <webview>. Memory usage (KB):', args[0]);
                    this.refresh();
                    break;
                }
                default:
                    break;
            }
        });
    }

    refresh() {
        // if (this.wv.isMounted) {
        //     this.wv.element.reload();
        //     log.debug('App was refreshed', this.wv.screenName);
        // }
        this.switchTo(this.wv.screenName);
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
