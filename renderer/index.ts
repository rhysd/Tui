import {ipcRenderer as ipc} from 'electron';
import RendererApp from './app';
import log from './log';

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    const app = new RendererApp(config);
    ipc.on('tuitter:account', (__, index: number, screenName: string) => {
        log.debug('Will switch to account', index, screenName);
        app.switchTo(screenName.slice(1)); // Strip '@'
    });
});
