import * as glob from 'glob';
import {remote, ipcRenderer as ipc} from 'electron';
import {AppContext} from './context';
import {SELECTORS} from './constants';

export interface Plugin {
    onStart?(context: AppContext): void;
    onTweetStatus?(tweetElement: HTMLDivElement, context: AppContext): void;
    onKeymap?: {
        [keymapName: string]: (context: AppContext) => void;
    }
}

export default class PluginManger {
    public readonly plugins: {[absolutePath: string]: Plugin} = {};

    static create(globPaths: string[], ctx: AppContext) {
        if (globPaths.length === 0) {
            return Promise.resolve(new PluginManger([], ctx));
        }

        const options = {
            cwd: remote.app.getPath('userData'),
            absolute: true,
        };

        return Promise.all(
            globPaths.map(gp => new Promise<string[]>((resolve, reject) => {
                glob(
                    gp,
                    options,
                    (err, paths) => err ? reject(err) : resolve(paths),
                );
            }))
        ).then((pathsList: string[][]) =>
            new PluginManger(
                // flatten
                pathsList.reduce((acc, p) => {
                    Array.prototype.push.apply(acc, p);
                    return acc;
                }, []),
                ctx,
            )
        );
    }

    constructor(pluginPaths: string[], private ctx: AppContext) {
        console.log('Tui: Plugin manager constructed with paths:', pluginPaths);
        const existingTweets = ctx.timelineRoot === null ?  [] :
            ctx.timelineRoot.querySelectorAll(SELECTORS.tweet) as NodeListOf<HTMLElement>;
        for (const p of pluginPaths) {
            const plugin = this.loadPlugin(p);
            if (plugin !== null) {
                // Simply ignore the plugin on failing to load it.
                this.registerPlugin(p, plugin, existingTweets);
            }
        }
        ctx.tweetWatcher.on('added', this.onTweetAdded);
    }

    registerPlugin(pluginPath: string, plugin: Plugin, currentTimeline: Iterable<HTMLElement>) {
        this.plugins[pluginPath] = plugin;
        if (plugin.onStart) {
            plugin.onStart(this.ctx);
        }
        if (plugin.onTweetStatus) {
            for (const tw of currentTimeline) {
                plugin.onTweetStatus(tw as HTMLDivElement, this.ctx);
            }
        }
        if (plugin.onKeymap) {
            for (const name in plugin.onKeymap) {
                const callback = plugin.onKeymap[name];
                ipc.on(`tuitter:keymap:${name}`, () => {
                    callback(this.ctx);
                });
            }
        }
    }

    loadPlugin(absolutePath: string) {
        try {
            // Note: require() always fails after preloading script.
            const p = require(absolutePath) as Plugin;
            console.log('Tui: Plugin loaded:', p);
            return p;
        } catch (e) {
            console.error('Tui: Failed to load a plugin from ' + absolutePath, e);
            return null;
        }
    }

    private onTweetAdded = (tw: HTMLDivElement) => {
        for (const key in this.plugins) {
            const p = this.plugins[key];
            if (p.onTweetStatus) {
                p.onTweetStatus(tw, this.ctx);
            }
        }
    }
}
