import {dispatchContext} from './context';
import KeymapsHandler from './keymaps_handler';

// TODO:
// Make PluginManager
// TODO:
// Get list of plugin files via IPC
// TODO:
// Implement loading plugin

function applyFilterPlugin(tweet: HTMLDivElement) {
    console.error('Tui: TODO: Apply plugin to tweet element:', tweet);
}

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            dispatchContext().then(ctx => {
                ctx.tweetWatcher.on('added', applyFilterPlugin);
                const keymaps = new KeymapsHandler(ctx);
                keymaps.subscribeIpc();
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
