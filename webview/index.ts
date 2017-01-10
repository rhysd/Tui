import {EventEmitter} from 'events';

const ClassNames = {
    tweet: '_1eF_MiFx',
};

const SELECTORS = {
    tweet: `div.${ClassNames.tweet}[role="row"]`,
    notificationCount: '.Fe7ul3Lt.Z_PqXzzk._2DggF3sL._2izplv41',
};

function doPollingForElementExists(selector: string, retry: number) {
    return new Promise<HTMLElement>(resolve => {
        let count = 0;
        function watch() {
            const e = document.querySelector(selector);
            if (e !== null) {
                return resolve(e as HTMLElement);
            }
            if (count < retry) {
                ++count;
                window.setTimeout(watch, 200);
            }
        }
        watch();
    });
}

// TODO:
// Make PluginManager
// TODO:
// Get list of plugin files via IPC
// TODO:
// Implement loading plugin

function applyFilterPlugin(tweet: HTMLDivElement) {
    console.error('Tui: TODO: Apply plugin to tweet element:', tweet);
}

class TweetWatcher extends EventEmitter {
    observer: MutationObserver | null = null;

    constructor() {
        super();
    }

    start(timelineRoot: HTMLDivElement) {
        if (this.observer !== null) {
            console.error('Tui: Already watching tweets:', this.observer);
            return;
        }

        const observer = new MutationObserver(mutations => {
            const tweetClassName = ClassNames.tweet;
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    if ((n as HTMLDivElement).className === tweetClassName) {
                        this.emit('added', n);
                    }
                }
                for (const n of m.removedNodes) {
                    if ((n as HTMLDivElement).className === tweetClassName) {
                        this.emit('removed', n);
                    }
                }
            }
        });

        observer.observe(timelineRoot, {
            childList: true,
        });

        this.observer = observer;
    }

    isWatching() {
        return this.observer !== null;
    }
}

class AppContext {
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

function dispatchContext() {
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

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            dispatchContext().then(ctx => {
                ctx.tweetWatcher.on('added', applyFilterPlugin);
            });
            // Note: Ensure to run this clause once
            document.removeEventListener('readystatechange', handler);
            break;
        }
        default:
            break;
    }
};

document.addEventListener('readystatechange', handler);
