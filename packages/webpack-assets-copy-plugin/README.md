# Webpack Assets Copy Plugin (Shopware 6 Administration)

## How to use

### Install

```bash
npm install @pixolith/webpack-assets-copy-plugin --save-dev
```

### Add the plugin

```javascript
const AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin');
```

### Add this to the `plugins` section of your webpack.config.js

```javascript
new AssetsCopyPlugin({
    includes: ['js', 'css'],
    ignoreFiles: [/\*.hot-update.js/],
    from: 'public/bundles',
    to: 'custom/plugins/{plugin}/src/Resources/public',
}),
```
