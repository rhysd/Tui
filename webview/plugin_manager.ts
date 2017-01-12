import * as glob from 'glob';
import {remote} from 'electron';
import {AppContext} from './context';

export interface Plugin {
    onStart?(context: AppContext): void;
    onTweetStatus?(tweetElement: HTMLDivElement, context: AppContext): void;
}

export default class PluginManger {
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

    public plugins: {[absolutePath: string]: Plugin} = {};

    constructor(pluginPaths: string[], private ctx: AppContext) {
        console.log('Tui: Plugin manager constructed with paths:', pluginPaths);
        for (const p of pluginPaths) {
            const plugin = this.loadPlugin(p);
            this.plugins[p] = plugin;
            if (plugin.onStart) {
                plugin.onStart(ctx);
            }
        }
        ctx.tweetWatcher.on('added', this.onTweetAdded);
    }

    loadPlugin(path: string): Plugin {
        const p = require(path) as Plugin;
        console.log('Tui: Plugin loaded:', p);
        return p;
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
