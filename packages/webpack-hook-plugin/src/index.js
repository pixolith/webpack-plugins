const consola = require('consola');
const HookPlugin = function HookPlugin(options) {
    this.pluginName = 'HookPlugin';
    this.options = options;
};

HookPlugin.prototype.apply = function(compiler) {
    const args = arguments,
        options = this.options;

    Object.keys(options).forEach((hookKey) => {
        if (!compiler.hooks[hookKey]) {
            consola.error(`Hook: ${hookKey} doesn't exist`);
            return;
        }

        if (typeof options[hookKey] !== 'function') {
            consola.error(`Hook: ${hookKey} is not a function`);
            return;
        }

        compiler.hooks[hookKey].tap(this.pluginName, () => {
            options[hookKey](...args);
        });
    });
};

module.exports = HookPlugin;
