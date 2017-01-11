Tui
===

Twitter client based on https://mobile.twitter.com in menu bar.

![screenshot](https://github.com/rhysd/ss/blob/master/Tui/main.jpg?raw=true)

Features (under construction):

- Provide all features even if Twitter API doesn't provide (tracing conversation, group DM, votes, sync with https://twitter.com, ...)
- Kill promoted tweets
- User defined CSS
- User defined tweet filters written in JavaScript
- Various keymaps to do many things only with keyboard
- Available on macOS, Linux and Windows

All links outside https://mobile.twitter.com in tweets are opened in an external browser.

## Installation

This application is on pre-alpha stage. So currently only available with [npm](https://npmjs.com).

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

Configuration is written in JSON file in application direcotry. Please edit it with your favorite editor.
If you want to reset configuration, please simply remove the JSON file and restart application.

```sh
$ $EDITOR {app dir}/config.json
```

To know type of values of each keys, please see [type definition](./typings/config.d.ts).

### hot\_key

`hot_key` is a key sequence to toggle application window. The shortcut key is defined globally.
The format is a [Electron's accelerator](https://github.com/electron/electron/blob/master/docs/api/accelerator.md). Please see the document to know how to configure this value.
Default value is `"CmdOrCtrl+Shift+S"`. If you want to disable, please set empty string or `null`. 

### icon\_color

Color of icon in menu bar. `"white"` or `"black"` is available. Default value is `"black"`.

### always\_on\_top

When this value is set to `true`, the window won't be hidden if it loses a focus. Default value is `false`.

### normal\_window

When this value is set to `true`, application will be launched as a normal window application.
If menu bar behavior does not work for you, please use set this value to `true` to avoid it.
Default value is `false`.

### zoom\_factor

Font zoom factor in application. It should be positive number. For example, `0.7` means `70%` font zooming.
Default font size is a bit bigger because https://mobile.twitter.com is originally for mobile devices. So default value is `0.9`.

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
| `browser-go-back`        | Navigate to go back like a browser                          | `backspace`  |
| `browser-go-forward`     | Navigate to go forward like a browser                       | N/A          |
| `browser-reload`         | Navigate to reload like a browser                           | N/A          |
| `quit-app`               | Quit application                                            | N/A          |
| `open-devtools`          | Open DevTools for current page                              | N/A          |

## User Defined CSS

When you put `user.css` in application directory, Tui automatically loads it and applies to underlying https://mobile.twitter.com.
You can create a theme for https://mobile.twitter.com and hide some elements by `display: none`.

[This](https://github.com/rhysd/dogfiles/blob/master/stylish/twitter.css) is one example of `user.css`.

## User Defined JS Script

You can also put `user.js` in application directory. It will be loaded when loading https://mobile.twitter.com at first.
Please do not assume that it's loaded deterministically. It will be loaded while loading https://mobile.twitter.com.
DOM may not be ready yet. In that case, you need to wait `load` event.

## TODOs

This application is under construction.
Please visit [the Project page](https://github.com/rhysd/Tui/projects/1) to know the features I'm planning.

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

