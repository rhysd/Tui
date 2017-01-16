import {
    Menu,
    MenuItem,
} from 'electron';
import log from './log';

export default class AccountSwitcher {
    currentIndex = 0;

    constructor(
        private win: Electron.BrowserWindow,
        accounts: string[],
    ) {
        const submenu = [] as Electron.MenuItemOptions[];
        for (let i = 0; i < accounts.length; ++i) {
            let screenName = accounts[i];
            if (!screenName.startsWith('@')) {
                screenName = '@' + screenName;
            }
            submenu.push({
                label: screenName,
                type: 'radio',
                checked: false,
                click: () => this.switchAccountTo(i, screenName),
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
    }

    private switchAccountTo(index: number, screenName: string) {
        if (index === this.currentIndex) {
            log.debug('Current account is already set. Skipped', index, screenName);
        }
        this.win.webContents.send('tuitter:account', index, screenName);
        this.currentIndex = index;
        log.debug('Switch to other account', index, screenName);
    }
}
