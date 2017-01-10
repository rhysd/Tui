Tui
===

Twitter client based on https://mobile.twitter.com in menu bar.

![screenshot](https://github.com/rhysd/ss/blob/master/Tui/main.jpg?raw=true)

Features (under construction):

- Provide all features even if Twitter API doesn't provide (tracing conversation, group DM, votes, ...)
- Kill promoted tweets
- User defined CSS
- User defined tweet filters written in JavaScript
- Keymaps
- Available on macOS, Linux and Windows

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

## Config

Configuration is written in JSON file. Please edit it with your favorite editor.
If you want to reset configuration, please simply remove the JSON file and restart application.

```sh
$ $EDITOR {data dir}/config.json
```

The `{data dir}` is depending on the OS.

- `~/Library/Application\ Support/Tui` for macOS
- `~/.config/Tui` for Linux
- `%APPDATA%\Tui` for Windows.

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

The key sequence format is [mousetrap](https://craig.is/killing/mice). Note that this format is different from `hot_key` above.
`mod` means `Cmd` in macOS and `Ctrl` in other OS.

| Action Name              | Description                                                | Default Key |
|--------------------------|------------------------------------------------------------|-------------|
| `next-tweet`             | Scroll down window per one tweet                           | `mod+j`     |
| `previous-tweet`         | Scroll up window per one tweet                             | `mod+k`     |
| `unfocus-tweet`          | Unfocus current focus on tweet                             | `esc`       |
| `scroll-down-page`       | Scroll down window per page                                | `mod+f`     |
| `scroll-up-page`         | Scroll up window per page                                  | `mod+b`     |
| `scroll-up-to-new-tweet` | Scroll to newest tweet when 'New Tweet' popup is displayed | `mod+n`     |
| `switch-home-timeline`   | Switch to 'Home Timeline' tab                              | `mod+1`     |
| `switch-notifications`   | Switch to 'Notifications' tab                              | `mod+2`     |
| `switch-direct-messages` | Switch to 'Direct Messages' tab                            | `mod+3`     |
| `switch-search`          | Switch to 'Search' tab                                     | `mod+4`     |
| `open-devtools`          | Open DevTools for current page                             | N/A         |

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

