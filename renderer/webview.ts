import * as path from 'path';
import * as fs from 'fs';
import {EventEmitter} from 'events';
import {shell} from 'electron';
import {USERAGENT} from './constants';
import log from './log';

export default class WebView extends EventEmitter {
    private elem: Electron.WebViewElement;
    private mounted = false;

    get element() {
        return this.elem;
    }

    get contents() {
        return this.elem.getWebContents();
    }

    constructor(public readonly screenName: string) {
        super();
        const wv = document.createElement('webview');
        wv.id = 'main-webview';
        wv.setAttribute('useragent', USERAGENT);
        wv.setAttribute('partition', 'persist:' + screenName);
        wv.setAttribute('autosize', 'on');
        wv.setAttribute('preload', `file://${path.join(__dirname, '../webview/index.js')}`);

        wv.addEventListener('new-window', this.onNewWindow);
        wv.addEventListener('crashed', this.onCrashed);
        wv.addEventListener('ipc-message', this.onIpcMessage);
        wv.addEventListener('dom-ready', this.onDomReady);
        this.elem = wv;
    }

    unmount() {
        this.elem.removeEventListener('new-window', this.onNewWindow);
        this.elem.removeEventListener('crashed', this.onCrashed);
        this.elem.removeEventListener('ipc-message', this.onIpcMessage);
        this.elem.removeEventListener('dom-ready', this.onDomReady);
        this.removeAllListeners();
        if (this.elem.isDevToolsOpened()) {
            this.elem.closeDevTools();
        }
        const parent = this.elem.parentElement;
        if (parent === null) {
            return;
        }
        parent.removeChild(this.elem);
        log.debug('Unmounted <webview>', this.screenName);
    }

    mountTo(parent: HTMLElement) {
        if (this.mounted) {
            throw new Error('<webview> is already mounted');
        }
        parent.appendChild(this.elem);
        this.elem.focus();
        this.mounted = true;
        log.debug(`Mounted webview for @${this.screenName}`, this.elem);
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

    // XXX: Typing channel names
    sendIpc(channel: string, ...args: any[]) {
        this.elem.send(channel, ...args);
    }

    applyCSS(file: string) {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                this.elem.insertCSS(data);
                log.debug('Applied CSS: ', file);
                resolve();
            });
        });
    }

    executeJS(file: string) {
        return new Promise<void>((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, code) => {
                if (err) {
                    return reject(err);
                }
                this.elem.executeJavaScript(code);
                log.debug('Executed JS: ', file);
                resolve();
            });
        });
    }

    focus() {
        if (this.mounted) {
            this.elem.focus();
        }
    }

    private readonly onNewWindow = (e: Electron.WebViewElement.NewWindowEvent) => {
        e.preventDefault();
        const url = e.url;
        if (!url.startsWith('https://mobile.twitter.com') && !url.startsWith('about:')) {
            log.debug('Trying to navigate to outside! Will open in browser:', url);
            shell.openExternal(url);
            return;
        }
        this.elem.src = e.url;
    }

    private readonly onCrashed = () => {
        log.error('Webview crashed! Reload <webview> to recover.');
    }

    private readonly onIpcMessage = (e: Electron.WebViewElement.IpcMessageEvent) => {
        log.debug('IPC message from ', e.channel, e.args);
        this.emit('ipc', e.channel, e.args);
    }

    private readonly onDomReady = () => {
        this.emit('dom-ready');
    }
}

