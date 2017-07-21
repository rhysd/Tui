import {app} from 'electron';
import loadConfig from './config';
import MainApp from './app';
import log from './log';

const appReady = new Promise<void>(resolve => app.once('ready', resolve));

app.on('will-quit', () => {
    log.debug('Application is quitting');
});

Promise.all([
    loadConfig().then(c => new MainApp(c)),
    appReady
]).then(([tui, _]) => tui.start()).then(() => {
    log.debug('Application launched!');
});
