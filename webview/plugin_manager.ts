import * as glob from 'glob';
import {remote} from 'electron';
import {AppContext} from './context';
import {SELECTORS} from './constants';
import KeymapsHandler from './keymaps_handler';

export interface Plugin {
    onKeymap?: {
        [keymapName: string]: (context: AppContext) => void;
    };
    onStart?(context: AppContext): void;
    onTweetStatus?(tweetElement: HTMLDivElement, context: AppContext): void;
}

export default class PluginManger {
    public readonly plugins: {[absolutePath: string]: Plugin} = {};

    static create(globPaths: string[], ctx: AppContext, keymaps: KeymapsHandler) {
        if (globPaths.length === 0) {
            return Promise.resolve(new PluginManger([], keymaps, ctx));
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
                keymaps,
                ctx,
            )
        );
    }

    constructor(pluginPaths: string[], private keymaps: KeymapsHandler, private ctx: AppContext) {
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
            try {
                plugin.onStart(this.ctx);
            } catch (e) {
                console.error('Tui: onTweetStatus: Error while executing plugin:', pluginPath, e);
            }
        }
        for (const tw of currentTimeline) {
            this.runOnTweetHook(pluginPath, tw as HTMLDivElement);
        }
        if (plugin.onKeymap) {
            for (const name in plugin.onKeymap) {
                const callback = plugin.onKeymap[name];
                this.keymaps.registerCustomHandler(name, callback);
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
            this.runOnTweetHook(key, tw);
        }
    }

    private runOnTweetHook(pluginPath: string, tw: HTMLDivElement) {
        const plugin = this.plugins[pluginPath];
        if (!plugin.onTweetStatus) {
            return;
        }

        try {
            plugin.onTweetStatus(tw as HTMLDivElement, this.ctx);
        } catch (e) {
            console.error('Tui: onTweetStatus: Error while executing plugin:', pluginPath, e);
        }
    }
}
