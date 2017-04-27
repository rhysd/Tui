import * as electron from 'electron';
import TweetWatcher from './tweet_watcher';
import {observeElementAppears} from './utils';
import SELECTORS from './selectors';

const RE_MESSAGE_CONVERSATION = /^\/messages\/[0-9\-]+$/;

export class AppContext {
    readonly tweetWatcher = new TweetWatcher();
    readonly selectors = SELECTORS;
    readonly electron = electron;
    timelineRoot: HTMLDivElement | null = null;
    private readonly location = location;

    isHomeTimeline() {
        return this.location.pathname === '/home';
    }

    isMentionTimeline() {
        return this.location.pathname === '/notifications';
    }

    isMessagesPage() {
        return this.location.pathname === ('/messages');
    }

    isMessagesConversationPage() {
        return RE_MESSAGE_CONVERSATION.test(this.location.pathname);
    }

    startWatchers(root: HTMLDivElement) {
        this.timelineRoot = root;
        this.tweetWatcher.start(root);
    }
}

export function dispatchContext() {
    const ctx = new AppContext();
    return observeElementAppears(SELECTORS.tweet).then(tw => {
        console.log('Tui: Timeline root element and header element found:', tw);

        // XXX:
        // Timeline element is a parent of parent of parent of tweet element
        // We can't locate timeline element directly because it doesn't have
        // any markable class name or attribute.
        let parent = tw.parentNode;
        parent = parent ? parent.parentNode : parent;
        parent = parent ? parent.parentNode : parent;
        if (parent === null) {
            console.error('Tui: No parent found for:', tw);
            return ctx;
        }

        ctx.startWatchers(parent as HTMLDivElement);
        return ctx;
    });
    // TODO:
    // On login window, there is no id="react-root" element. Instead there is
    // After logging-in, SPA starts as React application.
}

