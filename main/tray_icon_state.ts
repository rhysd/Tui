import * as path from 'path';
import {ipcMain as ipc} from 'electron';
import log from './log';

type State
    = 'normal'
    | 'informed'
    | 'notified'
;

const InformedIcon = path.join(__dirname, '..', 'resources', 'tray-icon-blue@2x.png');
const NotifiedIcon = path.join(__dirname, '..', 'resources', 'tray-icon-red@2x.png');

export default function manageTrayIconState(tray: Electron.Tray, color: string) {
    const normalIcon = path.join(__dirname, '..', 'resources', `tray-icon-${
        color === 'white' ? 'white' : 'black'
    }@2x.png`);

    let current: State = 'normal';
    function subscribe(channel: string, state: State, icon: string) {
        ipc.on(channel, () => {
            if (current === state || (current === 'notified' && state === 'informed')) {
                // 'notified' is more important than 'informed'. So 'informed' should not
                // override 'notified'.
                return;
            }
            log.debug(`Notification changed ${current} -> ${state}`);
            tray.setImage(icon);
            current = state;
        });
    }

    subscribe('tuitter:tray:informed', 'informed', InformedIcon);
    subscribe('tuitter:tray:notified', 'notified', NotifiedIcon);
    subscribe('tuitter:tray:normal', 'normal', normalIcon);
}
