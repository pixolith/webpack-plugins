# Webpack Hook Plugin

## How to use

### Install

```bash
npm install @pixolith/webpack-twig-assets-emitter-plugin --save-dev
```

### Add the plugin

```javascript
const TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin');
```

### Add this to the `plugins` section of your webpack.config.js

```javascript
new TwigAssetEmitterPlugin({
    includes: ['js', 'css'],
    ignoreFiles: [/\*.hot-update.js/],
    template: {
        scripts: {
            namespace: '@Storefront/storefront',
            path: '',
            filename: '_px_base.html.twig',
        },
        styles: {
            namespace: '@Storefront/storefront',
            path: 'layout',
            filename: '_px_meta.html.twig',
        },
        hints: {
            namespace: '@Storefront/storefront',
            path: 'layout',
            filename: '_px_meta.html.twig',
        },
    },
}),
```
