import {app} from 'electron';
import loadConfig from './config';
import App from './app';
import log from './log';

const appReady = new Promise<void>(resolve => app.once('ready', resolve));

process.on('unhandledRejection', (reason: string) => {
    log.error('FATAL: Unhandled rejection! Reason:', reason);
});

app.on('will-quit', () => {
    log.debug('Application is quitting');
});

Promise.all([
    loadConfig().then(c => new App(c)),
    appReady
]).then(([app, _]) => app.start()).then(() => {
    log.debug('Application launched!');
});
