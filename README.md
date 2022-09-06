# live2d-viewer-web

[Web page](https://guansss.github.io/live2d-viewer-web/)

An application of [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display).

## Installation

```sh
yarn install
```

## Setup

1. Place `live2dcubismcore.min.js` in `public/`.
2. Modify `scripts/const.js` if you want to change the model source repositories.
3. Run `node scripts/download.js`
4. Run `node scripts/parse.js`

Note the `download.js` scraps file lists from the specified repos, which may exceed GitHub's API rate limit if too many requests are fired.

## Serving

```sh
yarn serve
```

## Building

```sh
yarn build
```
