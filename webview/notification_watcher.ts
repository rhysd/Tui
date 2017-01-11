import {ipcRenderer as ipc} from 'electron';
import {SELECTORS} from './constants';

function setupNotificationObserver(target: HTMLElement, cb: (a: boolean, b: boolean) => void) {
    const o = new MutationObserver(muts => {
        let added = false;
        let removed = false;
        for (const m of muts) {
            if (m.addedNodes.length > 0) {
                added = true;
            }
            if (m.removedNodes.length > 0) {
                removed = true;
            }
            if (added && removed) {
                break;
            }
        }
        cb(added, removed);
    });
    o.observe(target, {
        childList: true
    });
    return o;
}

function onMentionsChanged(added: boolean, removed: boolean) {
    console.log('Tui: Mention notification changed', added, removed);
    if (added && !removed) {
        ipc.sendToHost('tuitter:notified:mentions');
    } else if (!added && removed) {
        ipc.sendToHost('tuitter:un-notified:mentions');
    }
}

function onMessagesChanged(added: boolean, removed: boolean) {
    console.log('Tui: Messaages notification changed', added, removed);
    if (added && !removed) {
        ipc.sendToHost('tuitter:notified:messages');
    } else if (!added && removed) {
        ipc.sendToHost('tuitter:un-notified:messages');
    }
}

export default class NotiicationWatcher {
    private mentionObserver: MutationObserver | null = null;
    private messageObserver: MutationObserver | null = null;

    start(header: HTMLElement) {
        const elems = header.querySelectorAll(SELECTORS.notifications);
        if (elems.length < 3) {
            console.error('Tui: Notification icons were not found:', elems);
            return;
        }

        this.mentionObserver = setupNotificationObserver(
            elems[1].parentElement as HTMLElement,
            onMentionsChanged,
        );
        this.messageObserver = setupNotificationObserver(
            elems[2].parentElement as HTMLElement,
            onMessagesChanged,
        );
    }

    isWatching() {
        return this.mentionObserver !== null &&
               this.messageObserver !== null;
    }
}
