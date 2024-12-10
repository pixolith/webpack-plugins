# px Webpack plugins

See `/packages` for individual packages

## Plugins

-   [webpack-hook-plugin](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-hook-plugin)
-   [webpack-twig-assets-emitter-plugin](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-twig-assets-emitter-plugin)
-   [webpack-assets-copy-plugin](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-assets-copy-plugin)
-   [webpack-watcher](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-watcher)

## Configs

-   [webpack-sw6-config](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-sw6-config)
-   [webpack-typo3-config](https://github.com/pixolith/webpack-plugins/tree/master/packages/webpack-typo3-config)
-   [eslint-config-typo3](https://github.com/pixolith/webpack-plugins/tree/master/packages/eslint-config-typo3)
-   [eslint-config-sw6](https://github.com/pixolith/webpack-plugins/tree/master/packages/eslint-config-sw6)
-   [prettier-config](https://github.com/pixolith/webpack-plugins/tree/master/packages/prettier-config)

<p>
    <img align="left" src="https://cloud.githubusercontent.com/assets/952783/15271604/6da94f96-1a06-11e6-8b04-dc3171f79a90.png" width="150" height="150" />
    <img src="https://avatars2.githubusercontent.com/u/11898073?s=200&v=4" width="150" height="150" alt="pixolith"/>
</p>

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Publish

```shell
npm login && lerna publish
```

## Working with this repository
1. set pixolith dependencies of webpack-sw6-config to local file
```json
{
    "@pixolith/external-svg-sprite-loader": "file:../webpack-external-sprite-loader",
    "@pixolith/webpack-assets-copy-plugin": "file:../webpack-assets-copy-plugin",
    "@pixolith/webpack-filename-linter-plugin": "file:../webpack-filename-linter-plugin",
    "@pixolith/webpack-hook-plugin": "file:../webpack-hook-plugin",
    "@pixolith/webpack-sw6-plugin-map-emitter": "file:../webpack-sw6-plugin-map-emitter",
    "@pixolith/webpack-watcher": "file:../webpack-watcher"
}
```

2. go into webpack-sw6-config and link the npm module
```shell
cd packages/webpack-sw6-config
npm link
cd ../../
```

3. require current version with linking feature
```shell
npm link --install-links @pixolith/webpack-sw6-config
```

4. copy some shopware vendor and custom files here to test \o/
