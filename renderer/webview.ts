import * as path from 'path';
import {USERAGENT} from './constants';

export default class WebView {
    private elem: Electron.WebViewElement;
    private mounted = false;

    get element() {
        return this.elem;
    }

    get contents() {
        return this.elem.getWebContents();
    }

    constructor() {
        const wv = document.createElement('webview');
        wv.id = 'main-webview';
        wv.setAttribute('useragent', USERAGENT);
        wv.setAttribute('partition', 'persist:tuitter');
        wv.setAttribute('autosize', 'on');
        wv.setAttribute('preload', `file://${path.join(__dirname, '../webview/index.js')}`);

        wv.addEventListener('new-window', e => {
            e.preventDefault();
            wv.src = e.url;
        });
        wv.addEventListener('crashed', () => {
            log.error('Webview crashed! Reload <webview> to recover.');
        });
        this.elem = wv;
    }

    mountTo(parent: HTMLElement) {
        if (this.mounted) {
            throw new Error('<webview> is already mounted');
        }
        parent.appendChild(this.elem);
        this.mounted = true;
    }

    openURL(url: string) {
        return new Promise<void>(resolve => {
            const resolver = () => {
                this.elem.removeEventListener('dom-ready', resolver);
                resolve();
            };
            this.elem.addEventListener('dom-ready', resolver);
            this.elem.src = url;
        });
    }
}

