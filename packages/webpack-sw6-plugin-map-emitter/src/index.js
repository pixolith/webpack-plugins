const Fs = require('fs'),
    Path = require('path'),
    ChangeCase = require('change-case');
const { promisify } = require('util');
const writeFileAsync = promisify(Fs.writeFile);

const Sw6PluginMapEmitter = function Sw6PluginMapEmitter(options) {
    this.pluginName = 'Sw6PluginMapEmitter';
    this.options = options;
};

Sw6PluginMapEmitter.prototype.apply = function(compiler) {
    const options = this.options;

    compiler.hooks.afterEmit.tapAsync(
        this.pluginName,
        async (compilation, next) => {
            let match = /\/([a-z0-9-]*)\.*/,
                files = {},
                ignoreFiles =
                    options.ignoreFiles && Array.isArray(options.ignoreFiles)
                        ? options.ignoreFiles.concat([/\*.hot-update.js/])
                        : [/\*.hot-update.js/],
                includes = options.includes || [];

            let _compilationAssets = JSON.parse(
                JSON.stringify(compilation.assets),
            );
            let _compilationAssetsKeys = Object.keys(_compilationAssets);

            _compilationAssetsKeys = _compilationAssetsKeys.filter(
                (assetKey) => {
                    let isIgnored = false;

                    // remove all files that are empty
                    if (_compilationAssets[assetKey]._size <= 10) {
                        return false;
                    }

                    ignoreFiles.forEach((ignoreFile) => {
                        if (ignoreFile.test(assetKey)) {
                            isIgnored = true;
                        }
                    });

                    return !isIgnored;
                },
            );

            _compilationAssetsKeys.forEach((key) => {
                let validFiles = includes.filter((include) => {
                    return `.${include}` === Path.extname(key);
                });

                if (!validFiles.length) {
                    return;
                }

                let plugin = key.match(match);

                if (plugin && plugin[1]) {
                    if (!files[plugin[1]]) {
                        files[plugin[1]] = {};
                    }

                    includes.forEach((include) => {
                        if (!files[plugin[1]][include]) {
                            files[plugin[1]][include] = [];
                        }

                        if (key.includes(`.${include}`)) {
                            files[plugin[1]][include].push(key);
                        }
                    });
                }
            });

            let pluginMap = {};
            await Promise.all(
                Object.keys(files).map(async (key) =>  {
                    let bundleName = `${ChangeCase.pascalCase(key)}`;

                    if (key.includes('vendor')) {
                        pluginPath = `vendor/pxsw/${key.substr(12)}`;
                        bundleName = `Pxsw${ChangeCase.pascalCase(key.substr(12))}`;
                    }
                    bundleName = bundleName.replace('PxswPxsw', 'Pxsw')


                    pluginMap[bundleName] = files[key];
                }),
            );
            await writeFileAsync(
                'var/px_plugins.json',
                JSON.stringify(pluginMap),
                'utf-8'
            )
        });
};

module.exports = Sw6PluginMapEmitter;
