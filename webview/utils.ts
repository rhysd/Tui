export function observeElementAppears(selector: string) {
    return new Promise<HTMLElement>((resolve, reject) => {
        const root = document.getElementById('react-root');
        if (root === null) {
            return reject(new Error('No react-root element found'));
        }

        const observer = new MutationObserver(muts => {
            for (const mut of muts) {
                for (const n of mut.addedNodes) {
                    if ((n as HTMLElement).matches(selector)) {
                        observer.disconnect();
                        return resolve(n as HTMLElement);
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
