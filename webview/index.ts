import {ipcRenderer as ipc} from 'electron';
import {dispatchContext} from './context';
import KeymapsHandler from './keymaps_handler';
import PluginManager from './plugin_manager';

const pluginPaths = new Promise<string[]>(resolve => {
    ipc.once('tuitter:plugin-paths', (_: any, paths: string[]) => {
        console.log('Tui: Received plugin paths:', paths);
        resolve(paths);
    });
});

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            dispatchContext().then(ctx => {
                const keymaps = new KeymapsHandler(ctx);
                keymaps.subscribeIpc();
                pluginPaths
                    .then(paths => PluginManager.create(paths, ctx))
                    .then(manager => {
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
