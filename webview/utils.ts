// XXX:
// Use MutationObserver and observe 'subtree' of <div id="react-root"></div>
// When first tweet element is found, stop observing.
export function doPollingForElementExists(selector: string, retry: number) {
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

