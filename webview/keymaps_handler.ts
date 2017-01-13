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
        } else {
            window.scrollTo(0, 0);
        }
        this.setCurrentFocusedTweet(null);
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
        const button = document.querySelector(SELECTORS.newTweetButton) as HTMLElement | null;
        if (button !== null) {
            button.click();
            this.focusNewTweetTextarea();
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
        this.focusNewTweetTextarea();
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
        this.focusNewTweetTextarea();
    }

    'open-images'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        const thumb = this.focusedTweet.querySelector(SELECTORS.thumbnailImageInTweet) as HTMLElement | null;
        if (thumb === null) {
            return;
        }
        thumb.click();
    }

    'open-images-in-browser'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        const thumb = this.focusedTweet.querySelector(SELECTORS.thumbnailImageInTweet) as HTMLAnchorElement | null;
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

    'open-tweet'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        const body = this.focusedTweet.querySelector(SELECTORS.tweetBody) as HTMLDivElement | null;
        if (body === null) {
            return;
        }
        body.click();
    }

    'open-links'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }
        let urls = [];

        const text = this.focusedTweet.querySelector(SELECTORS.tweetText) as HTMLDivElement | null;
        if (text !== null) {
            const links = text.querySelectorAll('a');
            for (const l of links) {
                const u = (l as HTMLAnchorElement).href;
                if (u) {
                    urls.push(u);
                }
            }
        }

        const thumbnail = this.focusedTweet.querySelector(SELECTORS.thumbnailLinkInTweet) as HTMLAnchorElement | null;
        if (thumbnail !== null) {
            urls.push(thumbnail.href);
        }

        console.log('Tui: Open links:', urls);

        for (const u of urls) {
            if (!u.startsWith('https://mobile.twitter.com')) {
                // Do not open internal links with browser (e.g. @screen_name in tweet text)
                shell.openExternal(u);
            }
        }
    }

    'show-user'(_: AppContext) {
        if (inputIsFocused() || this.focusedTweet === null) {
            return;
        }

        const icons = this.focusedTweet.querySelectorAll(SELECTORS.tweetUserIcon);
        if (icons.length === 0) {
            return;
        }

        // Choose last icon when it contains conversation
        const target = icons[icons.length - 1] as HTMLElement;

        console.log('Tui: Open user:', target);
        target.click();
    }

    'browser-go-back'(_: AppContext) {
        const c = remote.getCurrentWebContents();
        if (inputIsFocused() || !c.canGoBack()) {
            return;
        }
        c.goBack();
    }

    'browser-go-forward'(_: AppContext) {
        const c = remote.getCurrentWebContents();
        if (inputIsFocused() || !c.canGoForward()) {
            return;
        }
        c.goForward();
    }

    'browser-reload'(_: AppContext) {
        const c = remote.getCurrentWebContents();
        if (inputIsFocused() || !c.canGoBack()) {
            return;
        }
        c.reload();
    }

    'quit-app'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        remote.app.quit();
    }

    'zoom-in'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.modifyZoomFactor(0.1);
        remote.getCurrentWebContents();
    }

    'zoom-out'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        this.modifyZoomFactor(-0.1);
    }

    'open-devtools'(_: AppContext) {
        if (inputIsFocused()) {
            return;
        }
        remote.getCurrentWebContents().openDevTools({mode: 'detach'});
    }

    private getFirstTweetInView(tweets: NodeList): HTMLDivElement | null {
        const viewTop = document.body.scrollTop;
        const viewBottom = viewTop + window.innerHeight;
        for (const tw of tweets) {
            const rect = (tw as HTMLDivElement).getBoundingClientRect();
            const top = viewTop + rect.top;
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

        const actionsBodies = this.focusedTweet.querySelectorAll(SELECTORS.tweetActions);
        if (actionsBodies.length === 0) {
            console.error('Unexpected number of actions body in tweet element:', actionsBodies);
            return false;
        }

        // Tweet element may contain multiple tweets because of conversation
        const actionsBody = actionsBodies[actionsBodies.length - 1] as HTMLDivElement;

        const actions = actionsBody.querySelectorAll(SELECTORS.tweetAction);
        if (actions.length !== 4) {
            console.error('Unexpected number of actions in tweet element:', actions);
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

    private modifyZoomFactor(diff: number) {
        const c = remote.getCurrentWebContents();
        c.getZoomFactor(factor => {
            c.setZoomFactor(factor + diff);
        });
    }

    // Ensure to focus textare to input a tweet text
    private focusNewTweetTextarea() {
        const textarea = document.querySelector(SELECTORS.newTweetTextarea) as HTMLElement | null;
        if (textarea === null) {
            console.error('Tui: Textarea not found after clicking new tweet button.');
            return;
        }
        setTimeout(() => textarea.focus(), 0);
    }
}
