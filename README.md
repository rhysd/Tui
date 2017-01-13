Tui
===

Twitter client based on https://mobile.twitter.com in menu bar.

<img src="https://github.com/rhysd/ss/blob/master/Tui/desktop.jpg?raw=true" width="700" alt="application screenshot"/>

Features

- Provide all features even if Twitter API doesn't provide (tracing conversation, group DM, votes, sync with https://twitter.com, ...)
- Kill promoted tweets
- User defined CSS
- User defined tweet filters written in JavaScript as commonjs modules
- Various keymaps to do many things only with keyboard
- You can choose menu bar window or normal window
- Available on macOS, Linux and Windows

All links outside https://mobile.twitter.com in tweets are opened in an external browser.

## Installation

Download archived file for your environment from [release page](https://github.com/rhysd/Tui/releases). Please follow the instruction in the release page.

Or available as [npm package](https://www.npmjs.com/package/tuitter).

```
$ npm install --global tuitter
```

## Usage

Start from command line.

```
$ tuitter
```

To show DevTools, set the environment variable. There will be two DevTools window.
One is for renderer process of native window. Another is for `<webview>` which actually renders https://mobile.twitter.com.

```
$ NODE_ENV=development tuitter
```

## Application Directory

Tui has a directory for application data. The path depends on your OS.

- `~/Library/Application\ Support/Tui` for macOS
- `~/.config/Tui` for Linux
- `%APPDATA%\Tui` for Windows.

## Notifications

There is an icon in menu bar. You can toggle application window by clicking it.
And you can notice that there are notifications or direct messages by the color of it.

### Normal Icon

![normal icon](https://github.com/rhysd/ss/blob/master/Tui/normal.jpg?raw=true)

Normally icon in menu bar is black (or white).

### Notified Icon

![informed icon](https://github.com/rhysd/ss/blob/master/Tui/informed.jpg?raw=true)

When there are some unread notifications in 'Notifications' tab, icon will be blue.

### Important Notice Icon

![notified icon](https://github.com/rhysd/ss/blob/master/Tui/notified.jpg?raw=true)

When there are unread direct messages, icon will be red.

## Config

Configuration is written in JSON file in application directory. Please edit it with your favorite editor.
If you want to reset configuration, please simply remove the JSON file and restart application.

```sh
$ $EDITOR {app dir}/config.json
```

To know type of values of each keys, please see [type definition](./typings/config.d.ts).

### keymaps

Define keymaps of this application as JSON object. The key is a key sequence and the value is an action name.
For example, `"mod+shift+j": "next-tweet"` assigns `next-tweet` action to key sequence `Cmd+Shift+J` (or `Ctrl+Shift+J` on other OS).
`mod` means `Cmd` in macOS and `Ctrl` in other OS.

The key sequence format is [mousetrap](https://craig.is/killing/mice). Note that this format is different from `hot_key` above.

| Action Name              | Description                                                 | Default Key  |
|--------------------------|-------------------------------------------------------------|--------------|
| `next-tweet`             | Scroll down window per one tweet                            | `j`          |
| `previous-tweet`         | Scroll up window per one tweet                              | `k`          |
| `unfocus-tweet`          | Unfocus current focus on tweet. It can cancel editing tweet | `esc`        |
| `scroll-down-page`       | Scroll down window per page                                 | `f`          |
| `scroll-up-page`         | Scroll up window per page                                   | `b`          |
| `scroll-up-to-new-tweet` | Scroll to newest tweet when 'New Tweet' popup is displayed  | `n`          |
| `switch-home-timeline`   | Switch to 'Home Timeline' tab                               | `1`          |
| `switch-notifications`   | Switch to 'Notifications' tab                               | `2`          |
| `switch-direct-messages` | Switch to 'Direct Messages' tab                             | `3`          |
| `switch-search`          | Switch to 'Search' tab                                      | `4`          |
| `new-tweet`              | Start editing a new tweet                                   | `tab`        |
| `send-tweet`             | Send current editing tweet                                  | `ctrl+enter` |
| `reply-tweet`            | Reply to the focused tweet                                  | `enter`      |
| `retweet-tweet`          | Retweet the focused tweet                                   | `R`          |
| `quote-tweet`            | Retweet with quoting the focused tweet                      | `Q`          |
| `like-tweet`             | Like with quoting the focused tweet                         | `L`          |
| `open-images`            | Open image or video in the focused tweet                    | `i`          |
| `open-images-in-browser` | Open image or video in focused tweet with external browser  | `I`          |
| `open-tweet`             | Open tweet page for the focused tweet                       | `o`          |
| `open-links`             | Open links contained in the focused tweet with browser      | `l`          |
| `show-user`              | Open user page of the focused tweet's author                | `u`          |
| `browser-go-back`        | Navigate to go back like a browser                          | `backspace`  |
| `browser-go-forward`     | Navigate to go forward like a browser                       | N/A          |
| `browser-reload`         | Navigate to reload like a browser                           | N/A          |
| `zoom-in`                | Zoom font size by 10%                                       | `mod+plus`   |
| `zoom-out`               | Zoom font size by -10%                                      | `mod+-`      |
| `quit-app`               | Quit application                                            | N/A          |
| `open-devtools`          | Open DevTools for current page                              | N/A          |

### normal\_window

When this value is set to `true`, application will be launched as a normal window application.
If menu bar behavior does not work for you, please use set this value to `true` to avoid it.
Default value is `false`.

<img src="https://github.com/rhysd/ss/blob/master/Tui/normal_window.png?raw=true" width="443" alt="normal window mode"/>

### hot\_key

`hot_key` is a key sequence to toggle application window. The shortcut key is defined globally.
The format is a [Electron's accelerator](https://github.com/electron/electron/blob/master/docs/api/accelerator.md). Please see the document to know how to configure this value.
Default value is `"CmdOrCtrl+Shift+S"`. If you want to disable, please set empty string or `null`. 

### plugins

String array of paths to your plugins. As described below, plugin is loaded with Node.js's `require()`.
So it can be a single file path or npm package directory path.
You can specify both absolute path and relative path to application directory.
For example, when you have `{app dir}/some_plugin.js`, you can specify `["some_plugin.js"]` as the value.

These paths can contain glob. For example, `plugins/*.js` will load all JavaScript files in `{app dir}/plugins` directory.

Default value is `[]`.

### icon\_color

Color of icon in menu bar. `"white"` or `"black"` is available. In macOS, it's depending on the system is dark mode or not.
In other platforms, default value is or `"black"`.

### always\_on\_top

When this value is set to `true`, the window won't be hidden if it loses a focus. Default value is `false`.

### zoom\_factor

Font zoom factor in application. It should be positive number. For example, `0.7` means `70%` font zooming.
Default font size is a bit bigger because https://mobile.twitter.com is originally for mobile devices. So default value is `0.9`.

### home\_url

Home URL loaded when application starts. If you see a list or something instead of home timeline, please modify this URL.
Default value is `"https://mobile.twitter.com"`.

## Plugin

Tui can load your JavaScript plugin and you can hook some points in application. Plugin paths can be specified in `config.json` (see above).
Each paths will be loaded with Node.js's `require()`. So you can create a plugin as a single JavaScript or npm package structure directory.

Plugin must export one object which (may) contains hooks as property. Current supported hooks are:

- `onStart(ctx)`: When application started
- `onTweetStatus(tw, ctx)`: When a tweet appears in application's timeline. `tw` is a DOM element which represents a tweet.

The `ctx` parameter is an instance of [`AppContext` class](./webview/context.ts).
Interface definition is [described in TypeScript code](./webview/plugin_manager.ts).

Plugins are loaded in https://mobile.twitter.com context. So you can modify DOM element directly and freely.

Below is a super simple plugin to filter f\*ck words.

```javascript
const FWORDS = [
    'Fuck',
    'fuck',
];

module.exports = {
    onTweetStatus(tw, ctx) {
        const text = tw.innerText;
        for (const w of FWORDS) {
            if (text.indexOf(w) >= 0) {
                tw.style.display = 'none';
                break;
            }
        }
    }
};
```

To see the log, it's easy way to specify environment variable `NODE_ENV=development`. It opens DevTools at app starting.
Or there is a keymap to open DevTools (it's not assigned to any key by default).

Note that hooks are called with blocking. Please do not execute heavy process or consider to use `setTimeout()` to defer heavy process.

## User Defined CSS

When you put `user.css` in application directory, Tui automatically loads it and applies to underlying https://mobile.twitter.com.
You can create a theme for https://mobile.twitter.com and hide some elements by `display: none`.

[This](https://github.com/rhysd/dogfiles/blob/master/stylish/twitter.css) is one example of `user.css`.

## User Defined JS Script

You can also put `user.js` in application directory. It will be loaded when loading https://mobile.twitter.com at first.
Please do not assume that it's loaded deterministically. It will be loaded while loading https://mobile.twitter.com.
DOM may not be ready yet. In that case, you need to wait `load` event.

## Future

- Switch multi accounts
- Tests

## Development

```
$ git clone https://github.com/rhysd/Tui.git && cd Tui

# Install all dependencies into node_modules/
$ npm install

# Build app (it's written in TypeScript)
$ npm run build

# Run app in debug mode
$ npm run debug

# Apply tslint and stylelint to codes
$ npm run lint
```

