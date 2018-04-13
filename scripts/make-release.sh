#!/bin/bash

set -e

function prepare-app() {
    if [ -d app ]; then
        rm -rf app
    fi
    mkdir app

    npm run build

    cp -R bin main renderer resources webview package-lock.json package.json app/
    cd app/

    npm install --production
    npm uninstall --production --save electron
    npm prune --production
    npm install --production
    cd -
}

function pack-app() {
    local version electron_version
    version="$(./bin/cli.js --version)"
    electron_version="$(electron --version)"
    electron_version="${electron_version#v}"

    electron-packager ./app --platform=darwin --arch=x64 "--app-copyright=copyright (c) 2016 rhysd" --app-version="$version" --build-version="$version" --icon=./resources/icon.icns --version="$electron_version" --no-prune
    electron-packager ./app --platform=linux --arch=all "--app-copyright=copyright (c) 2016 rhysd" --app-version="$version" --build-version="$version" --icon=./resources/icon.ico --version="$electron_version" --no-prune
    electron-packager ./app --platform=win32 --arch=all "--app-copyright=copyright (c) 2016 rhysd" --app-version="$version" --build-version="$version" --icon=./resources/icon.ico --version="$electron_version" --version-string="$version" --no-prune
}

function make-dist() {
    local version
    if [ -d dist ]; then
        rm -rf dist
    fi
    mkdir dist
    version="$(./bin/cli.js --version)"
    for dir in $(ls -1 | grep '^Tui-'); do
        mv "$dir/LICENSE" "$dir/LICENSE.electron"
        cp LICENSE README.md "$dir"
        zip --symlinks "dist/${dir}-${version}.zip" -r "$dir"
    done
    rm -rf Tui-*
    open dist
}

prepare-app
pack-app
make-dist
