import {ipcRenderer as ipc} from 'electron';
import App from './app';
import log from './log';

ipc.once('tuitter:config', (_: any, config: Config) => {
    log.debug('Config was sent from main:', config);
    const app = new App(config);
    ipc.on('tuitter:account', (_, index: number, screenName: string) => {
        log.debug('Will switch to account', index, screenName);
        app.switchTo(screenName.slice(1)); // Strip '@'
    })
});
