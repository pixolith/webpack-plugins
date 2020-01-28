# Webpack Hook Plugin

## How to use

### Add the plugin

```javascript
const HookPlugin = require('@pixolith/webpack-hook-plugin');
```

## Add this to the `plugins` section of your webpack config

```javascript
new HookPlugin({
    // use the hooks here directly https://webpack.js.org/api/compiler-hooks
    failed() {
        // run this when compilation fails
    },
    beforeRun() {
        // run this before compilation starts
    }),
    //... more hooks
});
```
