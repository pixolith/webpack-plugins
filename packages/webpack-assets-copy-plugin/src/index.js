const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
const consola = require('consola');
const pSeries = require('p-series');
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
                includes = options.includes || [],
                files = options.files || [];

            let _compilationAssets = JSON.parse(
                JSON.stringify(compilation.assets),
            );
            let _compilationAssetsKeys = Object.keys(_compilationAssets),
                _filteredCompilationAssetsKeys = [];

            _compilationAssetsKeys.forEach((assetKey) => {
                let isIgnored = ignoreFiles.filter((ignoreFile) => {
                    return ignoreFile.test(assetKey);
                });

                if (
                    !isIgnored.length &&
                    !_filteredCompilationAssetsKeys.includes(assetKey)
                ) {
                    _filteredCompilationAssetsKeys.push(assetKey);
                }
            });

            const filesTasks = files.map((file) => async () => {
                const tasks = _filteredCompilationAssetsKeys.map(
                    (assetKey) => async () => {
                        if (
                            !includes
                                .map((i) => `.${i}`)
                                .includes(path.extname(assetKey))
                        ) {
                            return;
                        }

                        let fromPath = path.resolve(
                                process.cwd(),
                                file.from,
                                assetKey,
                            ),
                            toPath = path.resolve(process.cwd(), file.to);

                        if (
                            file.replace &&
                            typeof file.replace === 'function'
                        ) {
                            toPath = file.replace(fromPath, toPath);
                        }

                        toPath = path.resolve(
                            toPath,
                            assetKey.replace(assetKey.split('/')[0] + '/', ''),
                        );

                        await mkdirp(path.dirname(toPath));
                        await copyFileAsync(fromPath, toPath).catch((err) =>
                            consola.error(err),
                        );
                    },
                );

                await pSeries(tasks);
            });

            await pSeries(filesTasks);

            next();
        },
    );
};

module.exports = AssetsCopyPlugin;
