Tui
===

Twitter client based on https://mobile.twitter.com in menu bar.

<img src="https://github.com/rhysd/ss/blob/master/Tui/desktop.jpg?raw=true" width="700" alt="application screenshot"/>

Features

- Provide all features even if Twitter API doesn't provide (tracing conversation, group DM, votes, sync with https://twitter.com, ...)
- Support [multi-accounts](#multi-accounts)
- User defined CSS and [Themes](#themes)
- User defined tweet filters written in JavaScript as commonjs modules ([plugins](#plugins))
- Various keymaps to do many things only with keyboard
- You can choose menu bar window, (split view) fullscreen or normal window
- Available on macOS, Linux and Windows

All links outside https://mobile.twitter.com in tweets are opened in an external browser.

When you want to make a new tweet, press `n` (it can be changed in config).

Even if you use menubar window, you can enter/leave fullscreen mode via menu item (View -> Enter/Leave FullScreen).
In fullscreen mode, app behaves like as normal window. Fullscreen mode is especially useful on macOS with split view.

## Installation

Download archived file for your environment from [release page](https://github.com/rhysd/Tui/releases). Please follow the instruction in the release page.

Or available as [npm package](https://www.npmjs.com/package/tuitter).

```
$ npm install --global tuitter
```

## Usage

If you installed this app from the release page, start this app by executing the binary.

If you installed this app via npm, start from command line.

```
$ tuitter
```

Almost all usage is the same as original https://mobile.twitter.com . You can use various key shortcuts
to operate the page (focusing on tweet, make new tweet, see image, open link in browser, and so on).
And you can use themes or plugins to extend this app (or even you can create one by yourself).
You can always access to this app via hot key.

this application can be in 3 modes:

- **Menubar window (default)**: Small window near the menu bar icon. When the window loses its focus, automatically window will be hidden. You can change window size.
- **(Split view) fullscreen**: Click 'Enter Fullscreen' in menu item. You can put this app in fullscreen mode as split view (in macOS).
- **Normal window**: By configuring, this app can be launched with normal window. You can use this app like as other normal applications.


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

| Action Name              | Description                                                 | Default Key   |
|--------------------------|-------------------------------------------------------------|---------------|
| `next-tweet`             | Scroll down window per one tweet                            | `j`           |
| `previous-tweet`         | Scroll up window per one tweet                              | `k`           |
| `unfocus-tweet`          | Unfocus current focus on tweet. It can cancel editing tweet | `esc`         |
| `scroll-down-page`       | Scroll down window per page                                 | `f`           |
| `scroll-up-page`         | Scroll up window per page                                   | `b`           |
| `scroll-up-to-top`       | Scroll to newest tweet when 'New Tweet' popup is displayed  | `t`           |
| `scroll-down-to-bottom`  | Scroll to the bottom of timeline                            | N/A           |
| `switch-home-timeline`   | Switch to 'Home Timeline' tab                               | `1`           |
| `switch-notifications`   | Switch to 'Notifications' tab                               | `2`           |
| `switch-direct-messages` | Switch to 'Direct Messages' tab                             | `3`           |
| `switch-search`          | Switch to 'Search' tab                                      | `4`           |
| `new-tweet`              | Start editing a new tweet                                   | `n`           |
| `send-tweet`             | Send current editing tweet                                  | `ctrl+enter`  |
| `reply-tweet`            | Reply to the focused tweet                                  | `enter`       |
| `retweet-tweet`          | Retweet the focused tweet                                   | `R`           |
| `quote-tweet`            | Retweet with quoting the focused tweet                      | `Q`           |
| `like-tweet`             | Like with quoting the focused tweet                         | `L`           |
| `open-images`            | Open image or video in the focused tweet                    | `i`           |
| `open-images-in-browser` | Open image or video in focused tweet with external browser  | `I`           |
| `open-tweet`             | Open tweet page for the focused tweet                       | `o`           |
| `open-links`             | Open links contained in the focused tweet with browser      | `l`           |
| `show-user`              | Open user page of the focused tweet's author                | `u`           |
| `browser-go-back`        | Navigate to go back like a browser                          | `backspace`   |
| `browser-go-forward`     | Navigate to go forward like a browser                       | N/A           |
| `browser-reload`         | Navigate to reload like a browser                           | N/A           |
| `zoom-in`                | Zoom font size by 10%                                       | `mod+plus`    |
| `zoom-out`               | Zoom font size by -10%                                      | `mod+-`       |
| `last-account`           | Switch account to most recently used one                    | `mod+shift+l` |
| `next-account`           | Switch account to next one in accounts list                 | `mod+shift+n` |
| `previous-account`       | Switch account to previous one in accounts list             | `mod+shift+p` |
| `quit-app`               | Quit application                                            | N/A           |
| `open-devtools`          | Open DevTools for current page                              | N/A           |

### normal\_window

When this value is set to `true`, application will be launched as a normal window application.
If menu bar behavior does not work for you, please use set this value to `true` to avoid it.
Default value is `false` on macOS or Linux, `true` on Windows because window position is broken in some version of Windows.

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

### accounts

`accounts` is a list of your accounts. Items should be `@screen_name`.
When this value is set, you can [switch account via menu item](#multi-accounts)
This value is not set by default (`null`).

```json
{
  "accounts": [
    "@main_account",
    "@sub_account"
  ]
}
```

### refresh\_on\_sleep

If this value is set to `true`, Tui will refresh its web contents at PC suspending when it consumes much memory.
The threshold which detemines the refresh occur or not is up to `refresh_threshold_memory_mb` config.
Default value is `true`.

### refresh\_threshold\_memory\_mb

Integer value (defaults to `500`). If `<webview>`'s current memory usage exceeds this value, app will refresh `<webview>` on PC suspending.
The unit is mega bytes. By default, when `<webview>` consuming more than 500MB, it will be refreshed at suspending.
Please see above `refresh_on_sleep` config also.

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

### notification

When this value is set to `false`, notification will be disabled and icon won't be changed even if new mentions or direct messages arrive. Default value is `true`.

## <a name="multi-accounts">Multi-accounts

When you set `accounts` value in your `config.json`, you can switch among your accounts via menu item.
When application has a focus, you can see 'Accounts' menu item in menu bar.
By clicking the item, you can see current one and switch to other.

<img src="https://github.com/rhysd/ss/blob/master/Tui/accounts.jpg?raw=true" width="435" alt="screenshot of switching accounts"/>

If you use Windows, you can show menu bar by pressing Alt key.

## Plugin

Tui can load your JavaScript plugin and you can hook some points in application. Plugin paths can be specified in `config.json` (see above).
Each paths will be loaded with Node.js's `require()`. So you can create a plugin as a single JavaScript or npm package structure directory.

Plugin must export one object which (may) contains hooks as property. Current supported hooks are:

- `onStart(ctx)`: When application started
- `onTweetStatus(tw, ctx)`: When a tweet appears in application's timeline. `tw` is a DOM element which represents a tweet.
- `onKeymap`: An object value whose keys are keymap name and values are the corresponding process.

The `ctx` parameter is an instance of [`AppContext` class](./webview/context.ts).
Interface definition is [described in TypeScript code](./webview/plugin_manager.ts).

Plugins are loaded in https://mobile.twitter.com context. So you can modify DOM element directly and freely.
As member of `AppContext` instance, there are [many useful CSS selectors](./webview/constants.ts) to choose proper element.

Below is a super simple plugin to filter f\*ck words.

```javascript
const FWORDS = [
    'Fuck',
    'fuck',
];

module.exports = {
    onTweetStatus(tw, ctx) {
        const textElement = tw.querySelector(ctx.selectors.tweetTextBody);
        if (textElement === null) {
            return;
        }
        const text = textElement.innerText;
        for (const w of FWORDS) {
            if (text.indexOf(w) >= 0) {
                tw.style.display = 'none';
                break;
            }
        }
    }
};
```

You can also create your original keymap with this. The `ctx` parameter is the same as above (`AppContext` instance), and
the `event` parameter is a `KeyboardEvent` on the keydown event. Note that `event.preventDefault()` is already called.
And keymap is not invoked when `<input>` or `<textarea>` is focused. So you need not to take care about them.

```javascript
module.exports = {
    onKeymap: {
        'show-my-cool-list': (ctx, event) => {
            // Note that all external links outside https://mobile.twitter.com are opened in a browser.
            href.location = 'https://mobile.twitter.com/Linda_pp/lists/my-cool-list';
        }
    }
};

// And add your original keymap in config.json
//  "keymaps": {
//    "mod+l": "show-my-cool-list"
//  },
```

To see the log, it's easy way to specify environment variable `NODE_ENV=development`. It opens DevTools at app starting.
Or there is a keymap to open DevTools (it's not assigned to any key by default).

Note that hooks are called with blocking. Please do not execute heavy process or consider to use `setTimeout()` to defer heavy process.

### <a name="plugins"> Plugins List

- [tui-plugin-filter-by-text](https://github.com/rhysd/tui-plugin-filter-by-text)

## User Defined CSS

When you put `user.css` in application directory, Tui automatically loads it and applies to underlying https://mobile.twitter.com.
You can create a theme for https://mobile.twitter.com and hide some elements by `display: none`.

[This](https://github.com/rhysd/dogfiles/blob/master/stylish/twitter.css) is one example of `user.css`.

## <a name="themes"> Themes

You can also put `theme.css` in application directory. It's also applied on loading https://mobile.twitter.com.
This CSS file intends to be used for changing colors in the page. `theme.css` is always loaded before loading `user.css`.
So you can override theme styles in `user.css` without modifying `theme.css`.

Below is a list of themes provided:

- [tui-theme-dark](https://github.com/rhysd/tui-theme-dark)

## User Defined JS Script

You can also put `user.js` in application directory. It will be loaded when loading https://mobile.twitter.com at first.
Please do not assume that it's loaded deterministically. It will be loaded while loading https://mobile.twitter.com.
DOM may not be ready yet. In that case, you need to wait `load` event.

## Future

- Dynamically toggle menubar <-> normal window
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

