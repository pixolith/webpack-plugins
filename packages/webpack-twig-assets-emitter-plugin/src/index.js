const Fs = require('fs');
const Path = require('path');
const Mkdirp = require('mkdirp');
const { promisify } = require('util');
const Consola = require('consola');
const ChangeCase = require('change-case');
const readFileAsync = promisify(Fs.readFile);
const writeFileAsync = promisify(Fs.writeFile);

const TwigAssetEmitterPlugin = function TwigAssetEmitterPlugin(options) {
    this.pluginName = 'TwigAssetEmitterPlugin';
    this.options = options;
};

TwigAssetEmitterPlugin.prototype.apply = function(compiler) {
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

            const tasks = Object.keys(options.template).map(
                (templateKey) => async () => {
                    if (templateKey !== 'admin') {
                        Consola.error('Only "admin" template is supported');
                        process.exit(1);
                    }

                    await Promise.all(
                        Object.keys(files).map(async (key) => {
                            let template = await readFileAsync(
                                `${__dirname}/${options.template[templateKey].filename}`,
                                'utf8',
                            ).catch((err) => {
                                Consola.error(err);
                                process.exit(1);
                            });

                            if (files[key].css.length) {
                                template = template.replace(
                                    '{# STYLES #}',
                                    `${files[key].css
                                        .map((file) => {
                                            return `<link rel="stylesheet" href="${options.template[templateKey].assetUrl}${file}">`;
                                        })
                                        .join('\n')}`,
                                );
                            }

                            if (files[key].js.length) {
                                template = template.replace(
                                    '{# SCRIPTS #}',
                                    `${files[key].js
                                        .map((file) => {
                                            return `<script defer type="module" src="${options.template[templateKey].assetUrl}${file}"></script>`;
                                        })
                                        .join('\n')}`,
                                );
                            }

                            // check if our plugin is in "vendor" or in "custom"
                            let pluginPath = key.includes('vendor') ?
                                `vendor/pxsw/${key.substr(12)}/src/Resources/views/administration` :
                                `custom/plugins/${ChangeCase.pascalCase(key)}/src/Resources/views/administration`;

                            await Mkdirp(pluginPath);

                            let outputPath = Path.join(
                                pluginPath,
                                options.template[templateKey].filename,
                            );

                            await writeFileAsync(outputPath, template, 'utf-8');
                        }),
                    );
                },
            );

            for (const task of tasks) {
                await task();
            }

            next();
        },
    );
};

module.exports = TwigAssetEmitterPlugin;
