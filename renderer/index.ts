import {ipcRenderer as ipc} from 'electron';
import log from './log';
import {
    USERAGENT,
    IS_DEBUG,
} from './constants';

function mountMainWebview(url: string = 'https://mobile.twitter.com') {
    return new Promise<Electron.WebViewElement>(resolve => {
        const container = document.getElementById('webview-container')!;

        const wv = document.createElement('webview');
        wv.src = url;
        wv.id = 'main-webview';
        wv.setAttribute('useragent', USERAGENT);
        wv.setAttribute('partition', 'persist:tuitter');
        wv.setAttribute('autosize', 'on');

        wv.addEventListener('new-window', e => {
            e.preventDefault();
            wv.src = e.url;
        });
        wv.addEventListener('crashed', () => {
            log.error('Webview crashed! Reload <webview> to recover.');
        });

        const resolver = () => {
            wv.getWebContents().openDevTools({mode: 'detach'});
            wv.removeEventListener('dom-ready', resolver);
            resolve(wv);
        };
        wv.addEventListener('dom-ready', resolver);

        container.appendChild(wv);
    });
}

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    mountMainWebview().then(elem => {
        if (IS_DEBUG) {
            elem.getWebContents().openDevTools({mode: 'detach'});
        }
    })
});

