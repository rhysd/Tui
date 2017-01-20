import {ipcRenderer as ipc} from 'electron';
import {dispatchContext} from './context';
import KeymapsHandler from './keymaps_handler';
import PluginManager from './plugin_manager';

const receivedConfig = new Promise<Config>(resolve => {
    ipc.once('tuitter:config', (_, c: Config) => {
        console.log('Tui: Received config:', c);
        resolve(c);
    });
});

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            Promise.all([
                dispatchContext(),
                receivedConfig,
            ]).then(([ctx, config]) => {
                const keymaps = new KeymapsHandler(
                    config.keymaps || {},
                    ctx,
                    config.smooth_scroll !== false
                );
                keymaps.subscribeKeydown();
                console.log('Tui: Now handling keymaps:', keymaps);

                PluginManager.create(config.plugins || [], ctx, keymaps).then(manager => {
                    console.log('Tui: Plugin manager created:', manager);
                });
            }).catch(e => {
                console.error('Tui: Error on initialization:', e);
            });
            // Note: Ensure to run this clause once
            document.removeEventListener('readystatechange', handler);
            break;
        }
        default:
            break;
    }
};

document.addEventListener('readystatechange', handler);
