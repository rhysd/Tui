import {remote, shell, ipcRenderer as ipc} from 'electron';
import * as Mousetrap from 'mousetrap';
import {AppContext} from './context';
import {SELECTORS} from './constants';

function targetIsInput(target: HTMLElement) {
    if (target.isContentEditable) {
        return true;
    }

    switch (target.tagName) {
        case 'TEXTAREA': {
            return true;
        }
        case 'INPUT': {
            const type = target.getAttribute('type');
            return type === 'search' ||
                   type === 'text' ||
                   type === 'url' ||
                   type === 'email' ||
                   type === 'tel' ||
                   type === 'number';
        }
        case 'SELECT': {
            return true;
        }
        default:
            return false;
    }
}

// stopCallback returns if the event should be captured by mousetrap.
// By default, mousetrap does not capture any event on focusing on <input> and <textarea>.
// I need to custom the behavior to capture input with modifiers or escape key.
Mousetrap.prototype.stopCallback = (e: KeyboardEvent, elem: HTMLElement) => {
    if (!targetIsInput(elem)) {
        return false;
    }

    if (e.ctrlKey || e.altKey || e.metaKey) {
        return false;
    }

    if (e.key === 'Escape') {
        return false;
    }

    return true;
};

type CustomHandler = (c: AppContext, e: KeyboardEvent) => void;

export default class KeymapsHandler {
    private customHandlers: {[name: string]: CustomHandler} = {};
    private focusedTweet: HTMLElement | null = null;
    constructor(private config: KeymapsConfig, private context: AppContext) {
    }

    subscribeKeydown() {
        for (const key in this.config) {
            this.registerKeymap(key, this.config[key]);
        }
        console.log('Tui: Keymappings are registered:', this.config);
    }

    registerKeymap(key: string, name: KeymapName | null) {
        if (!name) {
            return;
        }

        if (!this[name]) {
            Mousetrap.bind(key, e => {
                e.preventDefault();
                console.log('Tui: Keydown: Custom action: ' + key, name, e);
                const handle = this.customHandlers[name as string];
                if (!handle) {
                    console.error('Tui: No custom handler found for the action:', name);
                    return;
                }
                handle(this.context, e);
            });
        } else {
            const method = this[name].bind(this);
            Mousetrap.bind(key, e => {
                e.preventDefault();
                console.log('Tui: Keydown: ' + key, name, e);
                // Note: Need not to pass context because they can refer context
                // via this.context.
                method(e);
            });
        }
    }

    registerCustomHandler(name: string, handler: CustomHandler) {
        this.customHandlers[name] = handler;
        console.log('Tui: Registered keymap: ' + name, handler);
    }

    'next-tweet'() {
        this.moveFocusByOffset(1, false);
    }

    'previous-tweet'() {
        // Do not align with top of window because scrollIntoView() does not
        // consider header's height. If we set alignWithTop to true, tweet
        // would be hidden by header partially.
        this.moveFocusByOffset(-1, false);
    }

    'unfocus-tweet'() {
        // In 'Search' input or 'New direct message' textarea,
        // unfocus them to go out.
        const active = document.activeElement as HTMLElement | null;
        if (active && (
            active.matches(SELECTORS.directMessageTextarea) ||
            active.matches(SELECTORS.searchPageInput)
        )) {
            active.blur();
            return;
        }

        // In 'Edit Tweet' window, cancel tweet instead of removing focus.
        const cancel = document.querySelector(SELECTORS.cancelNewTweet) as HTMLElement | null;
        if (cancel !== null) {
            cancel.click();
            return;
        }

        this.setCurrentFocusedTweet(null);
    }

    'scroll-down-page'() {
        window.scrollBy(0, window.innerHeight);
        this.setCurrentFocusedTweet(
            this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems))
        );
    }

    'scroll-up-page'() {
        window.scrollBy(0, -window.innerHeight);
        this.setCurrentFocusedTweet(
            this.getFirstTweetInView(document.querySelectorAll(SELECTORS.tabItems))
        );
    }

    'scroll-up-to-top'() {
        const e = document.querySelector(SELECTORS.scrollUpToNewTweet) as HTMLElement | null;
        if (e !== null) {
            e.click();
        } else {
            window.scrollTo(0, 0);
        }
        this.setCurrentFocusedTweet(null);
    }

    'scroll-down-to-bottom'() {
        window.scrollTo(0, document.body.scrollHeight);
        this.setCurrentFocusedTweet(null);
    }

    // Note: Should use location.href = 'https://mobile.twitter.com/home'?
    'switch-home-timeline'() {
        this.clickTab(0);
    }

    'switch-notifications'() {
        this.clickTab(1);
    }

    'switch-direct-messages'() {
        this.clickTab(2);
    }

    'switch-search'() {
        if (this.clickTab(3)) {
            const input = document.querySelector(SELECTORS.searchPageInput) as HTMLInputElement | null;
            if (input) {
                input.focus();
            }
        }
    }

    // Note:
    // It can start to edit direct message also on 'Direct Messages' tab.
    'new-tweet'() {
        if (this.context.isMessagesConversationPage()) {
            const textarea = document.querySelector(SELECTORS.directMessageTextarea) as HTMLTextAreaElement | null;
            if (textarea === null) {
                console.error('Tui: Textarea for direct message was not found');
                return;
            }
            textarea.focus();
            return;
        }

        const button = (
            document.querySelector(SELECTORS.newTweetButton) ||
            document.querySelector(SELECTORS.newTweetButtonB)
        ) as HTMLElement | null;
        if (button !== null) {
            button.click();
            this.focusNewTweetTextarea();
        } else {
            if (this.clickTab(0)) {
                // If 'New Tweet' button not found, repeat again after moving to 'Home Timeline' tab.
                this['new-tweet']();
            }
        }
    }

    'send-tweet'() {
        const selector = this.context.isMessagesConversationPage() ?
            SELECTORS.directMessageSubmitButton : SELECTORS.sendTweet;
        const button = document.querySelector(selector) as HTMLElement | null;
        if (button !== null) {
            button.click();
        }
    }

    'reply-tweet'() {
        this.clickTweetAction(0);
        this.focusNewTweetTextarea();
    }

    'like-tweet'() {
        this.clickTweetAction(2);
    }

    'retweet-tweet'() {
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

    'quote-tweet'() {
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

    'open-images'() {
        if (this.focusedTweet === null) {
            return;
        }
        const thumb = this.focusedTweet.querySelector(SELECTORS.thumbnailImageInTweet) as HTMLElement | null;
        if (thumb === null) {
            return;
        }
        thumb.click();
    }

    'open-images-in-browser'() {
        if (this.focusedTweet === null) {
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

    'open-tweet'() {
        if (this.focusedTweet === null) {
            return;
        }

        if (this.context.isMessagesPage()) {
            this.focusedTweet.click();
            return;
        }

        const body = this.focusedTweet.querySelector(SELECTORS.tweetBody) as HTMLDivElement | null;
        if (body === null) {
            return;
        }
        body.click();
    }

    'open-links'() {
        if (this.focusedTweet === null) {
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

    'show-user'() {
        if (this.focusedTweet === null) {
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

    'browser-go-back'() {
        const c = remote.getCurrentWebContents();
        if (!c.canGoBack()) {
            return;
        }

        c.goBack();
    }

    'browser-go-forward'() {
        const c = remote.getCurrentWebContents();
        if (!c.canGoForward()) {
            return;
        }

        c.goForward();
    }

    'browser-reload'() {
        remote.getCurrentWebContents().reload();
    }

    'quit-app'() {
        remote.app.quit();
    }

    'zoom-in'() {
        this.modifyZoomFactor(0.1);
        remote.getCurrentWebContents();
    }

    'zoom-out'() {
        this.modifyZoomFactor(-0.1);
    }

    'open-devtools'() {
        remote.getCurrentWebContents().openDevTools({mode: 'detach'});
    }

    'last-account'() {
        ipc.send('tuitter:switch-account-last');
    }

    'next-account'() {
        ipc.send('tuitter:switch-account-next');
    }

    'previous-account'() {
        ipc.send('tuitter:switch-account-prev');
    }

    private getFirstTweetInView(tweets: NodeList): HTMLElement | null {
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

    private setCurrentFocusedTweet(tw: HTMLElement | null) {
        if (this.focusedTweet !== null) {
            this.focusedTweet.classList.remove('tuitter-focused-item');
        }
        this.focusedTweet = tw;
        if (tw !== null) {
            tw.classList.add('tuitter-focused-item');
        }
    }

    private getFocusableItemsSelector() {
        if (this.context.isMessagesPage()) {
            return SELECTORS.directMessagesThread;
        } else if (this.context.isMessagesConversationPage()) {
            return SELECTORS.directMessageItem;
        } else {
            return SELECTORS.tweet;
        }
    }

    private moveFocusByOffset(offset: number, alignWithTop: boolean) {
        const items = document.querySelectorAll(this.getFocusableItemsSelector()) as NodeListOf<HTMLElement>;

        // 'items' is NodeList. Array.prototype.indexOf() is not available.
        let idx = -1;
        for (let i = 0; i < items.length; ++i) {
            if (items[i] === this.focusedTweet) {
                idx = i;
                break;
            }
        }

        let next = items[idx + offset];
        if (idx < 0 || !next) {
            const first = this.getFirstTweetInView(items);
            if (first !== null) {
                next = first;
            }
        }
        if (!next && items.length > 0) {
            // Note:
            // Fallback when no item is in view.
            // Unless there is no item, show first item.
            next = items[0];
        }
        if (!next) {
            return;
        }

        next.scrollIntoView(alignWithTop);

        this.setCurrentFocusedTweet(next);
    }

    private clickTweetAction(index: number) {
        if (this.focusedTweet === null) {
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
        if (items.length === 0) {
            return false;
        }

        // Note:
        // Consider B type UI in A/B testing.
        // B type UI has user icon at the most left of header.
        // So, we need to skip it on clicking tab items.
        if (items[0].querySelector(SELECTORS.loginIcon) !== null) {
            index += 1;
        }

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
