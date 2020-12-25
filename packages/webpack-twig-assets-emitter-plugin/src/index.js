const fs = require('fs');
const Path = require('path');
const mkdirp = require('mkdirp');
const { promisify } = require('util');
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
                    if (!options.template[templateKey].path) {
                        options.template[templateKey].path = '';
                    }

                    if (!options.template[templateKey].namespace) {
                        options.template[templateKey].namespace = '';
                    }

                    await Promise.all(
                        Object.keys(files).map(async (key) => {
                            let output = '';
                            let template = await readFileAsync(
                                `${__dirname}/${options.template[templateKey].filename}`,
                                'utf8',
                            ).catch((err) => {
                                consola.error(err);
                                process.exit(1);
                            });

                            if (templateKey === 'hintsmodern') {
                                if (
                                    templateKey === 'hintsmodern' &&
                                    files[key].css.filter((file) =>
                                        file.includes('modern'),
                                    ).length
                                ) {
                                    output = `${files[key].css
                                        .map((file) => {
                                            return `<link rel="preload" href="{{ asset_url }}${file}" as="style">\n`;
                                        })
                                        .join('\n')}`;
                                }

                                if (templateKey === 'hintsmodern') {
                                    output += `${files[key].js
                                        .map((file) => {
                                            return `<link rel="preload" crossorigin="anonymous" href="{{ asset_url }}${file}" as="script">\n`;
                                        })
                                        .join('\n')}`;
                                }

                                if (!output) {
                                    return;
                                }
                            }

                            if (templateKey === 'styles') {
                                output = `${files[key].css
                                    .map((file) => {
                                        return `<script>if(window.isIE11){var link = document.createElement("link");link.rel = "stylesheet";link.href = "{{ asset_url }}${file}";document.head.appendChild(link);}</script>`;
                                    })
                                    .join('\n')}`;
                            }

                            if (templateKey === 'stylesmodern') {
                                output = files[key].css.length
                                    ? `
                                    ${files[key].css
                                        .map((file) => {
                                            return `
                                                <link rel="stylesheet" href="{{ asset_url }}${file}">
                                            `;
                                        })
                                        .join('\n')}
                                `
                                    : '';
                            }

                            if (templateKey === 'scriptsmodern') {
                                output = `${files[key].js
                                    .map((file) => {
                                        return `<script defer type="module" src="{{ asset_url }}${file}"></script>`;
                                    })
                                    .join('\n')}`;
                            }

                            if (templateKey === 'scripts') {
                                output = `${files[key].js
                                    .map((file) => {
                                        return `<script defer ${
                                            process.env.NODE_ENV ===
                                            'development'
                                                ? ''
                                                : 'nomodule'
                                        } src="{{ asset_url }}${file}"></script>`;
                                    })
                                    .join('\n')}`;
                            }

                            // check if our plugin is in "vendor" or in "custom"
                            let pluginPath = `custom/plugins/${changeCase.pascalCase(
                                key,
                            )}`;

                            if (key.includes('vendor')) {
                                pluginPath = `vendor/pxsw/${key.substr(12)}`;
                            }

                            pluginPath = Path.join(
                                pluginPath,
                                Path.join(
                                    `src/Resources/views/storefront/${options.template[templateKey].path}`,
                                ),
                            );

                            if (key.includes('pxsw-project')) {
                                template = template.replace(
                                    `{% sw_extends '${Path.join(
                                        options.template[templateKey].namespace,
                                        options.template[templateKey].path,
                                        options.template[templateKey].filename,
                                    )}' %}`,
                                    '',
                                );
                                template = template.replace(
                                    '{{ parent() }}',
                                    "{% if shopware.config.PxswProject.config.pxswServerEnvironment != 'live' %}",
                                );

                                template = template.replace(
                                    '{% endblock %}',
                                    '{% endif %}\n{% endblock %}',
                                );
                            }

                            await mkdirp(pluginPath);

                            let exists = await existsAsync(
                                Path.join(
                                    pluginPath,
                                    options.template[templateKey].filename,
                                ),
                            ).catch((err) => consola.error(err));

                            if (exists) {
                                let file = await readFileAsync(
                                    Path.join(
                                        pluginPath,
                                        options.template[templateKey].filename,
                                    ),
                                    'utf-8',
                                );

                                template = file;
                            }

                            let outputPath = Path.join(
                                pluginPath,
                                options.template[templateKey].filename,
                            );

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
