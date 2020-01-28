const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
const consola = require('consola');
const pSeries = require('p-series');
const changeCase = require('change-case');
const copyFileAsync = promisify(fs.copyFile);

const AssetsCopyPlugin = function AssetsCopyPlugin(options) {
    this.pluginName = 'AssetsCopyPlugin';
    this.options = options;
};

AssetsCopyPlugin.prototype.apply = function(compiler) {
    const options = this.options;

    compiler.hooks.afterEmit.tapAsync(
        this.pluginName,
        async (compilation, next) => {
            let ignoreFiles = options.ignoreFiles || [],
                includes = options.includes || [];

            let _compilationAssets = JSON.parse(
                JSON.stringify(compilation.assets),
            );
            let _compilationAssetsKeys = Object.keys(_compilationAssets);

            _compilationAssetsKeys.forEach((assetKey) => {
                ignoreFiles.forEach((ignoreFile) => {
                    if (ignoreFile.test(assetKey)) {
                        delete _compilationAssets[assetKey];
                    }
                });
            });

            const tasks = _compilationAssetsKeys.map((assetKey) => async () => {
                if (
                    !includes
                        .map((i) => `.${i}`)
                        .includes(path.extname(assetKey))
                ) {
                    return;
                }

                let fromPath = path.resolve(__dirname, options.from, assetKey),
                    pluginName = changeCase.pascalCase(
                        path
                            .basename(fromPath)
                            .replace(path.extname(fromPath), ''),
                    ),
                    toPathRaw = options.to.replace('{plugin}', pluginName),
                    toPath = path.resolve(__dirname, toPathRaw);

                toPath = path.resolve(
                    toPath,
                    assetKey.replace(assetKey.split('/')[0] + '/', ''),
                );

                await mkdirp(path.dirname(toPath));
                await copyFileAsync(fromPath, toPath).catch((err) =>
                    consola.error(err),
                );
            });

            await pSeries(tasks);

            next();
        },
    );
};

module.exports = AssetsCopyPlugin;
