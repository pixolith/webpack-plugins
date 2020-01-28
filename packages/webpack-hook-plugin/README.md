# Webpack Hook Plugin

## How to use

### Add the plugin

```javascript
const HookPlugin = require('@pixolith/webpack-hook-plugin');
```

### Add this to the `plugins` section of your webpack config

```javascript
new HookPlugin({
    failed() {
        // run this when compilation fails
    },
    beforeRun() {
        // run this before compilation starts
    }),
    //... more hooks
});
```

### What hooks are available

Check this list [Hooks](https://webpack.js.org/api/compiler-hooks)
