import TweetWatcher from './tweet_watcher';
import {doPollingForElementExists} from './utils';
import {SELECTORS} from './constants';

export class AppContext {
    location = location;
    timelineRoot: HTMLDivElement | null = null;
    tweetWatcher = new TweetWatcher();

    isHomeTimeline() {
        return this.location.pathname === '/home';
    }

    isMentionTimeline() {
        return this.location.pathname === '/notifications';
    }

    isMessagesPage() {
        return this.location.pathname.startsWith('/messages');
    }

    setTimelineRoot(root: HTMLDivElement) {
        this.timelineRoot = root;
        this.tweetWatcher.start(root);
    }
}

export function dispatchContext() {
    const ctx = new AppContext();
    if (ctx.isMessagesPage()) {
        return Promise.resolve(ctx);
    }

    return doPollingForElementExists(SELECTORS.tweet, 25).then(tw => {
        const parent = tw.parentNode;
        if (parent === null) {
            console.error('Tui: No parent found for:', tw);
            return ctx;
        }

        ctx.setTimelineRoot(parent as HTMLDivElement);
        return ctx;
    });
}

