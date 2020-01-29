const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
const rimraf = require('rimraf');
const consola = require('consola');
const pSeries = require('p-series');
const changeCase = require('change-case');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

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
                ignoreFiles = options.ignoreFiles || [],
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

            _compilationAssetsKeys.forEach((key) => {
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
                    let template = await readFileAsync(
                        options.template[templateKey].filename,
                        'utf8',
                    ).catch((err) => {
                        consola.error(err);
                        process.exit(1);
                    });

                    if (!options.template[templateKey].path) {
                        options.template[templateKey].path = '';
                    }

                    if (!options.template[templateKey].namespace) {
                        options.template[templateKey].namespace = '';
                    }

                    await Promise.all(
                        Object.keys(files).map(async (key) => {
                            let output = '';

                            if (templateKey === 'hints') {
                                output = `${files[key].js
                                    .map((file) => {
                                        return `<link rel="preload" href="/${file}" as="script">`;
                                    })
                                    .join('\n')}`;

                                output += `\n${files[key].css
                                    .map((file) => {
                                        return `<link rel="preload" href="/${file}" as="style">`;
                                    })
                                    .join('\n')}`;
                            }

                            if (templateKey === 'styles') {
                                output = `${files[key].css
                                    .map((file) => {
                                        return `<link rel="stylesheet" href="/${file}">`;
                                    })
                                    .join('\n')}`;
                            }

                            if (templateKey === 'scripts') {
                                output = `${files[key].js
                                    .map((file) => {
                                        return `<script src="/${file}" defer></script>`;
                                    })
                                    .join('\n')}`;
                            }

                            // check if our plugin is in "vendor" or in "custom"
                            let pluginPath = `www/custom/plugins/${changeCase.pascalCase(
                                key,
                            )}`;

                            if (key.includes('vendor')) {
                                pluginPath = `www/vendor/pxsw/${key.substr(
                                    12,
                                )}`;
                            }

                            pluginPath = path.join(
                                pluginPath,
                                path.join(
                                    `src/Resources/views/storefront/${options.template[templateKey].path}`,
                                ),
                            );

                            if (key.includes('pxsw-project')) {
                                template = template.replace(
                                    `{% sw_extends '${path.join(
                                        options.template[templateKey].namespace,
                                        options.template[templateKey].path,
                                        options.template[templateKey].filename,
                                    )}' %}`,
                                    '',
                                );
                                template = template.replace(
                                    '{{ parent() }}',
                                    '',
                                );
                            }

                            await mkdirp(pluginPath);

                            let exists = await existsAsync(
                                path.join(
                                    pluginPath,
                                    options.template[templateKey].filename,
                                ),
                            ).catch((err) => consola.error(err));

                            if (exists) {
                                let file = await readFileAsync(
                                    path.join(
                                        pluginPath,
                                        options.template[templateKey].filename,
                                    ),
                                    'utf-8',
                                );

                                template = file;
                            }

                            let outputPath = path.join(
                                pluginPath,
                                options.template[templateKey].filename,
                            );

                            rimraf.sync(outputPath);

                            await writeFileAsync(
                                outputPath,
                                template.replace(
                                    `{# ${templateKey.toUpperCase()} #}`,
                                    output.trim(),
                                ),
                                'utf-8',
                            );
                        }),
                    );
                },
            );

            await pSeries(tasks);

            next();
        },
    );
};

module.exports = TwigAssetEmitterPlugin;
