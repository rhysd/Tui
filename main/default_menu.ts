import * as path from 'path';
import { Menu, shell, app, BrowserWindow } from 'electron';

function getWindow(win: Electron.BrowserWindow | null): Electron.BrowserWindow | null {
    if (win && win.webContents) {
        return win;
    }
    const wins = BrowserWindow.getAllWindows();
    if (wins.length === 0) {
        return null;
    }
    const w = wins[0];
    w.focus();
    if (!w.webContents) {
        return null;
    }
    return w;
}

export default function defaultMenu() {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'New Tweet',
                    click(_, win) {
                        const w = getWindow(win);
                        if (w) {
                            w.webContents.send('tuitter:menu:new-tweet');
                        }
                    },
                },
                {
                    label: 'Edit Config',
                    click() {
                        shell.openItem(path.join(app.getPath('userData'), 'config.json'));
                    },
                },
                {
                    type: 'separator',
                },
                {
                    role: 'undo',
                },
                {
                    role: 'redo',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'cut',
                },
                {
                    role: 'copy',
                },
                {
                    role: 'paste',
                },
                {
                    role: 'pasteandmatchstyle',
                },
                {
                    role: 'delete',
                },
                {
                    role: 'selectall',
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                {
                    role: 'reload',
                },
                {
                    role: 'toggledevtools',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'resetzoom',
                },
                {
                    role: 'zoomin',
                },
                {
                    role: 'zoomout',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'togglefullscreen',
                },
            ],
        },
        {
            role: 'window',
            submenu: [
                {
                    role: 'minimize',
                },
                {
                    role: 'close',
                },
            ],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click() {
                        shell.openExternal('https://github.com/rhysd/Tui#readme');
                    },
                },
                {
                    label: 'Search Issues',
                    click() {
                        shell.openExternal('https://github.com/rhysd/Tui/issues');
                    },
                },
            ],
        },
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: 'Tui',
            submenu: [
                {
                    role: 'about',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'services',
                    submenu: [],
                },
                {
                    type: 'separator',
                },
                {
                    role: 'hide',
                },
                {
                    role: 'hideothers',
                },
                {
                    role: 'unhide',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'quit',
                },
            ],
        });

        (template[1].submenu as Electron.MenuItemConstructorOptions[]).push(
            {
                type: 'separator',
            },
            {
                label: 'Speech',
                submenu: [
                    {
                        role: 'startspeaking',
                    },
                    {
                        role: 'stopspeaking',
                    },
                ],
            },
        );

        template[3].submenu = [
            {
                role: 'close',
            },
            {
                role: 'minimize',
            },
            {
                role: 'zoom',
            },
            {
                type: 'separator',
            },
            {
                role: 'front',
            },
        ];
    } else {
        template.unshift({
            label: 'File',
            submenu: [
                {
                    role: 'quit',
                },
            ],
        });
    }

    return Menu.buildFromTemplate(template);
}
