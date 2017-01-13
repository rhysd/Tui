export function observeElementAppears(selector: string) {
    return new Promise<HTMLElement>((resolve, reject) => {
        const root = document.getElementById('react-root');
        if (root === null) {
            return reject(new Error('No react-root element found'));
        }

        const e = root.querySelector(selector) as HTMLElement | null;
        if (e !== null) {
            // Target element already exists.
            return resolve(e);
        }

        const observer = new MutationObserver(muts => {
            for (const mut of muts) {
                for (const n of mut.addedNodes) {
                    const e = n as HTMLElement;
                    if (e.matches(selector)) {
                        observer.disconnect();
                        return resolve(e);
                    }
                    const c = e.querySelector(selector) as HTMLElement | null;
                    if (c !== null) {
                        observer.disconnect();
                        return resolve(c);
                    }
                }
            }
        });

        observer.observe(root, {
            childList: true,
            subtree: true,
        });
    });
}
