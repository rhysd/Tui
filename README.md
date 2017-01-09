Tui
===

Twitter client based on https://mobile.twitter.com in menu bar.

![screenshot](https://github.com/rhysd/ss/blob/master/Tui/main.jpg?raw=true)

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

