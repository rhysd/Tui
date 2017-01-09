const SELECTORS = {
    tweet: 'div._1eF_MiFx[role="row"]',
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

type TweetMutatedCallback = (node: HTMLDivElement) => void;

function watchTweets(cb: TweetMutatedCallback) {
    // Timeout when no tweet found within 200ms * 25 = 5sec
    doPollingForElementExists(SELECTORS.tweet, 25).then(tw => {
        const parent = tw.parentNode;
        if (parent === null) {
            console.log('Tui: No parent found for:', tw);
            return;
        }

        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const n of m.addedNodes) {
                    cb(n as HTMLDivElement);
                }
            }
        });

        observer.observe(parent, {
            childList: true,
        });
    });
}

// TODO:
// Get list of plugin files via IPC
// TODO:
// Implement loading plugin

function applyFilterPlugin(tweet: HTMLDivElement) {
    console.error('TODO: Apply plugin to tweet element:', tweet);
}

const handler = () => {
    switch (document.readyState) {
        case 'interactive': {
            console.log('Tui: Reached to "interactive" state. Will inject codes');
            watchTweets(applyFilterPlugin);
            // Note: Ensure to run this clause once
            document.removeEventListener('readystatechange', handler);
            break;
        }
        default:
            break;
    }
};

document.addEventListener('readystatechange', handler);
