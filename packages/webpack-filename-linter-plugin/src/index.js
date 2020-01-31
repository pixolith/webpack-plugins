const consola = require('consola');
const FilenameLinterPlugin = function FilenameLinterPlugin(options) {
    this.pluginName = 'FilenameLinterPlugin';
    this.options = options;
};

FilenameLinterPlugin.prototype.apply = function(compiler) {
    const options = this.options;

    compiler.hooks.beforeCompile.tapAsync(
        'FilenameLinterPlugin',
        (params, callback) => {
            consola.info(params);
            callback();
        },
    );
};

module.exports = FilenameLinterPlugin;
