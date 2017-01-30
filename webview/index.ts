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

const receivedKeymaps = new Promise<KeymapsConfig>(resolve => {
    ipc.once('tuitter:keymaps', (_, k: KeymapsConfig) => {
        console.log('Tui: Received keymappings:', k);
        resolve(k);
    });
});

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            dispatchContext().then(ctx => {
                const keymaps = receivedKeymaps.then(k => {
                    const handlers = new KeymapsHandler(k, ctx);
                    handlers.subscribeKeydown();
                    console.log('Tui: Now handling keymaps:', handlers);
                    return handlers;
                });
                Promise.all([pluginPaths, keymaps])
                    .then(([paths, handlers]) => PluginManager.create(paths, ctx, handlers))
                    .then(manager => {
                        console.log('Tui: Plugin manager created:', manager);
                        console.log('Tui: Application launched. Memory(KB):', process.getProcessMemoryInfo());
                    });
                keymaps.then(k => {
                    ipc.on('tuitter:new-tweet', () => {
                        console.log('Tui: Received tuitter:new-tweet');
                        k['new-tweet']();
                    });
                });
                ipc.on('tuitter:will-suspend', (_, threshold: number) => {
                    const memKB = process.getProcessMemoryInfo().privateBytes;
                    console.log('Tui: Will suspend', threshold, memKB);
                    const memMB = memKB / 1000;
                    if (memMB > threshold) {
                        console.log('Tui: Memory usage exceeds the threshold. Request refreshing:', threshold, memMB);
                        ipc.sendToHost('tuitter:refresh-me', memKB);
                    }
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
