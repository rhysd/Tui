import {ipcRenderer as ipc, remote} from 'electron';
import {AppContext} from './context';
import {KEYMAP_NAMES, SELECTORS} from './constants';

export default class KeymapsHandler {
    private focusedTweet: HTMLDivElement | null = null;
    constructor(private context: AppContext) {
    }

    subscribeIpc() {
        for (const name of KEYMAP_NAMES) {
            ipc.on(`tuitter:keymap:${name}`, () => {
                console.log('Tui: Keymap received:', name);
                this[name].bind(this)(this.context);
            });
        }
    }

    private getFirstTweetInView(tweets: NodeList): HTMLDivElement | null {
        const viewTop = document.body.scrollTop;
        const viewBottom = viewTop + window.innerHeight;
        for (const tw of tweets) {
            const rect = (tw as HTMLDivElement).getBoundingClientRect();
            const top = viewTop + rect.top
            const bottom = viewTop + rect.bottom;
            const inView = (viewTop <= top && top < viewBottom) ||
                           (viewTop < bottom && bottom <= viewBottom);
            if (inView) {
                return tw as HTMLDivElement;
            }
        }
        return null;
    }

    private moveFocusByOffset(offset: number) {
        const tweets = document.querySelectorAll(SELECTORS.tweet);

        // 'tweets' is NodeList. Array.prototype.indexOf() is not available.
        let idx = -1;
        for (let i = 0; i < tweets.length; ++i) {
            if (tweets[i] === this.focusedTweet) {
                idx = i;
                break;
            }
        }

        let next = tweets[idx + offset] as HTMLDivElement | null;
        if (idx < 0 || !next) {
            next = this.getFirstTweetInView(tweets);
        }
        if (!next) {
            return;
        }

        next.scrollIntoView();

        this.focusedTweet = next;
    }

    private clickTab(index: number) {
        const items = document.querySelectorAll(SELECTORS.tabItems);
        if (items.length > index) {
            (items[index] as HTMLElement).click();
        }
    }

    'next-tweet'(_: AppContext) {
        this.moveFocusByOffset(1);
    }

    'previous-tweet'(_: AppContext) {
        this.moveFocusByOffset(-1);
    }

    'unfocus-tweet'(_: AppContext) {
        this.focusedTweet = null;
    }

    'scroll-down-page'(_: AppContext) {
        window.scrollBy(0, window.innerHeight);
        this.focusedTweet = this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems));
    }

    'scroll-up-page'(_: AppContext) {
        window.scrollBy(0, -window.innerHeight);
        this.focusedTweet = this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems));
    }

    'scroll-up-to-new-tweet'(_: AppContext) {
        const e = document.querySelector(SELECTORS.newTweet) as HTMLElement | null;
        if (e !== null) {
            e.click();
            return;
        } else {
            window.scrollTo(0, 0);
        }
    }

    // Note: Should use location.href = 'https://mobile.twitter.com/home'?
    'switch-home-timeline'(_: AppContext) {
        this.clickTab(0);
    }

    'switch-notifications'(_: AppContext) {
        this.clickTab(1);
    }

    'switch-direct-messages'(_: AppContext) {
        this.clickTab(2);
    }

    'switch-search'(_: AppContext) {
        this.clickTab(3);
    }

    'open-devtools'(_: AppContext) {
        remote.getCurrentWebContents().openDevTools({mode: 'detach'});
    }
}
