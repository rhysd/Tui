import {app} from 'electron';
import * as fs from 'fs';
import {join} from 'path';
import log from './log';

const DEFAULT_CONFIG = {
    hot_key: 'CmdOrCtrl+Shift+S',
    icon_color: process.platform === 'darwin' ? 'black' : 'white',
    always_on_top: false,
    normal_window: false,
    zoom_factor: 0.9,
    keymaps: {
        /* tslint:disable:object-literal-key-quotes */
        'j': 'next-tweet',
        'k': 'previous-tweet',
        'esc': 'unfocus-tweet',
        'f': 'scroll-down-page',
        'b': 'scroll-up-page',
        'n': 'scroll-up-to-new-tweet',
        '1': 'switch-home-timeline',
        '2': 'switch-notifications',
        '3': 'switch-direct-messages',
        '4': 'switch-search',
        'tab': 'new-tweet',
        'enter': 'reply-tweet',
        'R': 'retweet-tweet',
        'Q': 'quote-tweet',
        'L': 'like-tweet',
        'i': 'open-images',
        'I': 'open-images-in-browser',
        'o': 'open-tweet',
        'l': 'open-links',
        'backspace': 'browser-go-back',
        'ctrl+enter': 'send-tweet',
        /* tslint:enable:object-literal-key-quotes */
    },
} as Config;

export default function loadConfig(): Promise<Config> {
    return new Promise<Config>(resolve => {
        const dir = app.getPath('userData');
        const file = join(dir, 'config.json');
        fs.readFile(file, 'utf8', (err, json) => {
            if (err) {
                log.info('Configuration file was not found, will create:', file);
                // Note:
                // If calling writeFile() directly here, it tries to create config file before Electron
                // runtime creates data directory. As the result, writeFile() would fail to create a file.
                if (app.isReady()) {
                    fs.writeFile(file, JSON.stringify(DEFAULT_CONFIG, null, 2));
                } else {
                    app.once('ready', () => fs.writeFile(file, JSON.stringify(DEFAULT_CONFIG, null, 2)));
                }
                return resolve(DEFAULT_CONFIG);
            }
            try {
                const config = JSON.parse(json);
                if (config.hot_key && config.hot_key.startsWith('mod+')) {
                    config.hot_key = `CmdOrCtrl+${config.hot_key.slice(4)}`;
                }
                log.debug('Configuration was loaded successfully', config);
                resolve(config);
            } catch (e) {
                log.error('Error on loading JSON file, will load default configuration:', e.message);
                resolve(DEFAULT_CONFIG);
            }
        });
    });
}
