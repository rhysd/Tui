import {EventEmitter} from 'events';
import {
    Menu,
    MenuItem,
    ipcMain as ipc,
} from 'electron';
import log from './log';

export default class AccountSwitcher extends EventEmitter {
    prevIndex: number | null = null;
    currentIndex = 0;

    constructor(
        private win: Electron.BrowserWindow,
        private accounts: string[],
    ) {
        super();
        const submenu = [] as Electron.MenuItemOptions[];
        for (let i = 0; i < accounts.length; ++i) {
            if (!accounts[i].startsWith('@')) {
                accounts[i] = '@' + accounts[i];
            }
            let screenName = accounts[i];
            submenu.push({
                label: screenName,
                type: 'radio',
                checked: false,
                click: () => this.switchAccountTo(i),
            });
        }
        submenu[0].checked = true;

        const item = new MenuItem({
            label: 'Accounts',
            type: 'submenu',
            submenu,
        });

        const menu = Menu.getApplicationMenu();
        // Insert item before 'Help'
        menu.insert(menu.items.length - 1, item);
        Menu.setApplicationMenu(menu);

        ipc.on('tuitter:switch-account-last', () => this.switchAccountToLast());
        ipc.on('tuitter:switch-account-next', () => this.switchAccountToNext());
        ipc.on('tuitter:switch-account-prev', () => this.switchAccountToPrevious());
    }

    private switchAccountTo(index: number) {
        const screenName = this.accounts[index];
        if (!screenName || index === this.currentIndex) {
            log.debug('Current account is already set. Skipped', index, screenName);
        }
        this.win.webContents.send('tuitter:account', index, screenName);
        this.prevIndex = this.currentIndex;
        this.currentIndex = index;
        log.debug('Switch to other account', index, screenName);
        this.emit('will-switch', index, screenName);
    }

    private switchAccountToLast() {
        if (this.prevIndex === null) {
            if (this.accounts.length <= 1) {
                return;
            }
            this.switchAccountTo(1);
            return;
        }
        this.switchAccountTo(this.prevIndex);
    }

    private switchAccountToNext() {
        let next = this.currentIndex + 1;
        if (this.accounts.length <= next) {
            next = 0;
        }
        this.switchAccountTo(next);
    }

    private switchAccountToPrevious() {
        let next = this.currentIndex - 1;
        if (next < 0) {
            next = this.accounts.length - 1;
        }
        this.switchAccountTo(next);
    }
}
