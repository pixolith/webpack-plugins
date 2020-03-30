const Consola = require('consola');

module.exports = HookPlugin;

function HookPlugin(options) {
    this.compiler = {};
    this.pluginName = 'HookPlugin';
    this.compilation = {};
    for (var key in options) {
        this.compiler[key] = options[key];
    }
}

function tapHook(context, scope, name) {
    function error(reason) {
        Consola.error(
            new Error(`${this.pluginName} ` + scope + ':' + name + reason),
        );
    }

    let callback = this[scope][name];

    if (!callback) {
        return; // allow and ignore a falsy value
    }

    if (typeof callback !== 'function') {
        error("'s callback is not a function.");
        return;
    }

    let action = context.hooks[name].constructor.name
        .toLowerCase()
        .includes('async')
        ? 'tapAsync'
        : 'tap';

    let hook = context.hooks[name];

    if (!hook) {
        error(' is not a valid hook.');
        return;
    }

    hook[action]('hooks-webpack-plugin', callback);
}

HookPlugin.prototype.apply = function(compiler) {
    var tap = tapHook.bind(this, compiler, 'compiler');
    for (var key in this.compiler) {
        tap(key);
    }
};
