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

export default class NotiicationWatcher {
    private mentionObserver: MutationObserver | null = null;
    private messageObserver: MutationObserver | null = null;
    private mentionNotified = false;
    private messageNotified = false;

    private onMentionsChanged = (added: boolean, removed: boolean) => {
        console.log('Tui: Mention notification changed', added, removed);
        if (added && !removed) {
            if (!this.messageNotified) {
                // 'notified' is more important than 'informed'. So 'informed' should not
                // override 'notified'.
                ipc.sendToHost('tuitter:notified:mentions');
            }
            this.mentionNotified = true;
        } else if (!added && removed) {
            if (this.messageNotified) {
                ipc.sendToHost('tuitter:notified:messages');
            } else {
                ipc.sendToHost('tuitter:un-notified:mentions');
            }
            this.mentionNotified = false;
        }
    }

    private onMessagesChanged = (added: boolean, removed: boolean) => {
        console.log('Tui: Messaages notification changed', added, removed);
        if (added && !removed) {
            ipc.sendToHost('tuitter:notified:messages');
            this.messageNotified = true;
        } else if (!added && removed) {
            if (this.mentionNotified) {
                ipc.sendToHost('tuitter:notified:mentions');
            } else {
                ipc.sendToHost('tuitter:un-notified:messages');
            }
            this.messageNotified = false;
        }
    }

    start(header: HTMLElement) {
        const elems = header.querySelectorAll(SELECTORS.notifications);
        if (elems.length < 3) {
            console.error('Tui: Notification icons were not found:', elems);
            return;
        }

        this.mentionObserver = setupNotificationObserver(
            elems[1].parentElement as HTMLElement,
            this.onMentionsChanged,
        );
        this.messageObserver = setupNotificationObserver(
            elems[2].parentElement as HTMLElement,
            this.onMessagesChanged,
        );
    }

    isWatching() {
        return this.mentionObserver !== null &&
               this.messageObserver !== null;
    }

}
