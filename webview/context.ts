import TweetWatcher from './tweet_watcher';
import NotificationWatcher from './notification_watcher';
import {doPollingForElementExists} from './utils';
import {SELECTORS} from './constants';

export class AppContext {
    location = location;
    tweetWatcher = new TweetWatcher();
    notificationWatcher = new NotificationWatcher();
    timelineRoot: HTMLDivElement | null = null;

    isHomeTimeline() {
        return this.location.pathname === '/home';
    }

    isMentionTimeline() {
        return this.location.pathname === '/notifications';
    }

    isMessagesPage() {
        return this.location.pathname.startsWith('/messages');
    }

    startWatchers(root: HTMLDivElement, header: HTMLElement) {
        this.timelineRoot = root;
        this.tweetWatcher.start(root);
        this.notificationWatcher.start(header);
    }
}

export function dispatchContext() {
    const ctx = new AppContext();
    if (ctx.isMessagesPage()) {
        return Promise.resolve(ctx);
    }

    return Promise.all([
        doPollingForElementExists(SELECTORS.tweet, 25),
        doPollingForElementExists(SELECTORS.header, 25),
    ]).then(([tw, header]) => {
        const parent = tw.parentNode;
        if (parent === null) {
            console.error('Tui: No parent found for:', tw);
            return ctx;
        }

        ctx.startWatchers(parent as HTMLDivElement, header as HTMLElement);
        return ctx;
    });
}

