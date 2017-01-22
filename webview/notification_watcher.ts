import {ipcRenderer as ipc} from 'electron';
import SELECTORS from './selectors';

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

    start(header: HTMLElement) {
        let elems = header.querySelectorAll(SELECTORS.notificationsC);
        if (elems.length === 0) {
            elems = header.querySelectorAll(SELECTORS.notifications);
        }

        if (elems.length < 3) {
            console.error('Tui: Notification icons were not found:', elems);
            return;
        }

        const mention = elems[1] as HTMLElement;
        const message = elems[2] as HTMLElement;

        this.mentionObserver = setupNotificationObserver(mention, this.onMentionsChanged);
        this.messageObserver = setupNotificationObserver(message, this.onMessagesChanged);

        // Detect first state

        if (message.querySelector(SELECTORS.notificationIndicator) !== null) {
            this.messageDetected();
        }
        if (mention.querySelector(SELECTORS.notificationIndicator) !== null) {
            this.mentionDetected();
        }

        console.log('Tui: Notification watcher started', mention, message);
    }

    isWatching() {
        return this.mentionObserver !== null &&
               this.messageObserver !== null;
    }

    private mentionDetected() {
        if (!this.messageNotified) {
            // 'notified' is more important than 'informed'. So 'informed' should not
            // override 'notified'.
            ipc.sendToHost('tuitter:notified:mentions');
        }
        this.mentionNotified = true;
    }

    private messageDetected() {
        ipc.sendToHost('tuitter:notified:messages');
        this.messageNotified = true;
    }

    private onMentionsChanged = (added: boolean, removed: boolean) => {
        console.log('Tui: Mention notification changed', added, removed);
        if (added && !removed) {
            this.mentionDetected();
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
            this.messageDetected();
        } else if (!added && removed) {
            if (this.mentionNotified) {
                ipc.sendToHost('tuitter:notified:mentions');
            } else {
                ipc.sendToHost('tuitter:un-notified:messages');
            }
            this.messageNotified = false;
        }
    }
}
