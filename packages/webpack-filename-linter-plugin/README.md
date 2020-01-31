# Webpack Filename Linter Plugin

## How to use

### Install

```bash
npm install @pixolith/webpack-filename-linter-plugin --save-dev
```

### Add the plugin

```javascript
const FilenameLinterPlugin = require('@pixolith/webpack-filename-linter-plugin');
```

### Add this to the `plugins` section of your webpack.config.js

```javascript
new FilenameLinterPlugin({
    ignoreFiles: [/w/],
    rules: {
        css: 'kebab',
        js: 'kebab',
    },
});
```
