import {ipcRenderer as ipc, remote, shell} from 'electron';
import {AppContext} from './context';
import {KEYMAP_NAMES, SELECTORS, TWITTER_COLOR} from './constants';

function inputIsFocused() {
    const focused = document.activeElement;
    switch (focused.tagName) {
        case 'TEXTAREA': {
            return true;
        }
        case 'INPUT': {
            const type = focused.getAttribute('type');
            return type === 'search' ||
                   type === 'text' ||
                   type === 'url' ||
                   type === 'email' ||
                   type === 'tel' ||
                   type === 'number';
        }
        default:
            return false;
    }
}

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

    private setCurrentFocusedTweet(tw: HTMLDivElement | null) {
        if (this.focusedTweet !== null) {
            this.focusedTweet.style.border = null;
        }
        this.focusedTweet = tw;
        if (tw !== null) {
            tw.style.border = '1px solid ' + TWITTER_COLOR;
        }
    }

    private moveFocusByOffset(offset: number, alignWithTop: boolean) {
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

        next.scrollIntoView(alignWithTop);

        this.setCurrentFocusedTweet(next);
    }

    private clickTweetAction(index: number) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return false;
        }
        const actions = this.focusedTweet.querySelectorAll(SELECTORS.tweetActions);
        console.log('Tui: test:', actions);
        if (actions.length !== 4) {
            return false;
        }
        (actions[index] as HTMLElement).click();
        return true;
    }

    private clickTab(index: number) {
        const items = document.querySelectorAll(SELECTORS.tabItems);
        if (items.length > index) {
            (items[index] as HTMLElement).click();
            return true;
        } else {
            return false;
        }
    }

    'next-tweet'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.moveFocusByOffset(1, false);
    }

    'previous-tweet'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        // Do not align with top of window because scrollIntoView() does not
        // consider header's height. If we set alignWithTop to true, tweet
        // would be hidden by header partially.
        this.moveFocusByOffset(-1, false);
    }

    'unfocus-tweet'(_: AppContext) {
        const cancel = document.querySelector(SELECTORS.cancelNewTweet) as HTMLElement | null;
        if (cancel !== null) {
            // In 'Edit Tweet' window, cancel tweet instead of removing focus.
            cancel.click();
            return;
        }
        this.setCurrentFocusedTweet(null);
    }

    'scroll-down-page'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        window.scrollBy(0, window.innerHeight);
        this.setCurrentFocusedTweet(
            this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems))
        );
    }

    'scroll-up-page'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        window.scrollBy(0, -window.innerHeight);
        this.setCurrentFocusedTweet(
            this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems))
        );
    }

    'scroll-up-to-new-tweet'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        const e = document.querySelector(SELECTORS.scrollUpToNewTweet) as HTMLElement | null;
        if (e !== null) {
            e.click();
            return;
        } else {
            window.scrollTo(0, 0);
        }
    }

    // Note: Should use location.href = 'https://mobile.twitter.com/home'?
    'switch-home-timeline'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.clickTab(0);
    }

    'switch-notifications'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.clickTab(1);
    }

    'switch-direct-messages'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.clickTab(2);
    }

    'switch-search'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.clickTab(3);
    }

    // Note:
    // It can start to edit direct message also on 'Direct Messages' tab.
    'new-tweet'(ctx: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        const button = document.querySelector(SELECTORS.newTweet) as HTMLElement | null;
        if (button !== null) {
            button.click();
        } else {
            if (this.clickTab(0)) {
                // If 'New Tweet' button not found, repeat again after moving to 'Home Timeline' tab.
                this['new-tweet'](ctx);
            }
        }
    }

    'send-tweet'(_: AppContext) {
        const button = document.querySelector(SELECTORS.sendTweet) as HTMLElement | null;
        if (button !== null) {
            button.click();
        }
    }

    'reply-tweet'(_: AppContext) {
        this.clickTweetAction(0);
    }

    'like-tweet'(_: AppContext) {
        this.clickTweetAction(2);
    }

    'retweet-tweet'(_: AppContext) {
        if (!this.clickTweetAction(1)) {
            return;
        }
        const selectionButtons = document.querySelectorAll(SELECTORS.selectionDialogItems);
        if (selectionButtons.length < 2) {
            return;
        }
        const rtButton = selectionButtons[0] as HTMLElement;
        rtButton.click();
    }

    'quote-tweet'(_: AppContext) {
        if (!this.clickTweetAction(1)) {
            return;
        }
        const selectionButtons = document.querySelectorAll(SELECTORS.selectionDialogItems);
        if (selectionButtons.length < 2) {
            return;
        }
        const qtButton = selectionButtons[1] as HTMLElement;
        qtButton.click();
    }

    'open-images'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        const thumb = this.focusedTweet.querySelector(SELECTORS.thumbnailInTweet) as HTMLElement | null;
        if (thumb === null) {
            return;
        }
        thumb.click();
    }

    'open-images-in-browser'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        const thumb = this.focusedTweet.querySelector(SELECTORS.thumbnailInTweet) as HTMLAnchorElement | null;
        if (thumb === null) {
            return;
        }
        let url = thumb.href;
        if (url.startsWith('/')) {
            // When only path is specified (internal links)
            url = 'https://twitter.com' + url;
        }
        shell.openExternal(url);
    }

    'open-devtools'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        remote.getCurrentWebContents().openDevTools({mode: 'detach'});
    }
}
