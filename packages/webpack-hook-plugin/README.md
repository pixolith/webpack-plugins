# Webpack Hook Plugin

## How to use

## Add this to the plugin section

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
```
