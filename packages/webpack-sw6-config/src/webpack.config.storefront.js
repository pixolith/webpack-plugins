const config = require('./config');

const Path = require('path'),
    Fs = require('fs'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    ChangeCase = require('change-case'),
    Consola = require('consola'),
    Sw6PluginMapEmitterPlugin = require('@pixolith/webpack-sw6-plugin-map-emitter'),
    SvgStorePlugin = require('@pixolith/external-svg-sprite-loader');

module.exports = function createStorefrontConfig(themeOptions) {
    let themeName = themeOptions && themeOptions.themeName;
    let themeSlug = themeName ? ChangeCase.kebabCase(themeName) : 'storefront';

    let outputConfig = {
        path: config.outputPath,
        publicPath: config.isProd ? config.assetUrl : config.devServerPublicUrl,
        crossOriginLoading: config.isProd ? false : 'anonymous',
        chunkFilename: (chunkData) => {
            return `js/chunk[name]${config.isProd ? '.[contenthash]' : ''}.js`;
        },
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${
                config.isProd ? `.[contenthash]` : ''
            }.js`;
        },
        uniqueName: themeSlug,
    };

    let miniCssChunksConfig = {
        filename: `css/[name]${config.isProd ? '.[contenthash]' : ''}.css`,
        chunkFilename: `css/[name].vendor${
            config.isProd ? '.[contenthash]' : ''
        }.css`,
    };

    // Per-theme sprite path to avoid collisions between compilers
    let spritePath = `sprite/${themeSlug}-sprite.svg`;

    let entryFn = () => {
        let entryDir = Path.join(
            config.outputPath,
            '.theme-entries',
            themeSlug,
        );

        let entries = {};

        // Main theme entry
        let mainEntry = Path.join(entryDir, 'index.js');
        if (Fs.existsSync(mainEntry)) {
            entries[themeSlug] = mainEntry;
        }

        // Route-split SCSS entries
        let routeSplitFiles = Fs.existsSync(entryDir)
            ? Fs.readdirSync(entryDir).filter(
                  (f) => f.endsWith('.index.scss') && f !== 'index.scss',
              )
            : [];

        routeSplitFiles.forEach((file) => {
            let routeName = file.replace('.index.scss', '');
            let entryName = themeSlug + '_' + routeName;
            entries[entryName] = Path.join(entryDir, file);
        });

        if (config.isDebug) {
            Consola.info(`[${themeName || themeSlug}] Webpack entry points:`);
            console.table(entries);
        }

        return entries;
    };

    return {
        name: themeSlug,
        entry: entryFn,
        // -.- hardcoded fix for zbar-wasm and issue https://github.com/webpack/webpack/issues/16878
        resolve: {
            conditionNames: [
                'zbar-inlined',
                'browser',
                'import',
                'require',
                'default',
            ],
        },

        module: {
            rules: [
                {
                    // -.- hardcoded fix for zbar-wasm and issue https://github.com/webpack/webpack/issues/16878
                    test: /\.m?js$/,
                    include: /node_modules[\\/]@undecaf[\\/]zbar-wasm/,
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'new URL("./",import.meta.url)',
                                replace: '"/"',
                            },
                        },
                    ],
                },
                {
                    test: /\.js$/,
                    exclude: (file) => {
                        return /node_modules/.test(file);
                    },
                    use: [
                        {
                            loader: 'swc-loader',
                            options: {
                                env: {
                                    mode: 'entry',
                                    coreJs: '3.34.0',
                                    // .browserlist settings are not found by swc-loader, so we load it manually: https://github.com/swc-project/swc/issues/3365
                                    targets: require('browserslist').loadConfig(
                                        {
                                            config: './package.json',
                                        },
                                    ),
                                },
                                jsc: {
                                    parser: {
                                        syntax: 'typescript',
                                    },
                                    transform: {
                                        // NEXT-30535 - Restore babel option to not use defineProperty for class fields.
                                        // Previously (in v6.5.x) this was done by `@babel/preset-typescript` automatically.
                                        useDefineForClassFields: false,
                                    },
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.(jpe?g|png|gif|ico)(\?v=\d+\.\d+\.\d+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'img/[name][ext]',
                    },
                },
                {
                    test: /\.(eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext]',
                    },
                },
                {
                    test: /\.svg$/,
                    use: [
                        {
                            loader: SvgStorePlugin.loader,
                            options: {
                                name: spritePath,
                                iconName: '[name]',
                                overrideOrder: config.spriteOrder,
                                ignoreIconsByName: config.ignoreIcons,
                                onlySymbols: true,
                            },
                        },
                        {
                            loader: 'svgo-loader',
                            options: {
                                plugins: [
                                    'cleanupAttrs',
                                    'removeDoctype',
                                    'removeXMLProcInst',
                                    'cleanupEnableBackground',
                                    'convertStyleToAttrs',
                                    'convertPathData',
                                    'cleanupIds',
                                    'minifyStyles',
                                    'removeUselessDefs',
                                    'convertShapeToPath',
                                    'removeUnusedNS',
                                    'removeDimensions',
                                    'convertTransform',
                                    'collapseGroups',
                                    'removeComments',
                                    'removeEditorsNSData',
                                    'removeUnknownsAndDefaults',
                                ],
                            },
                        },
                    ],
                },
            ],
        },
        output: outputConfig,
        plugins: [
            new Sw6PluginMapEmitterPlugin({
                includes: ['js', 'css'],
                ignoreFiles: [/.*icons.*\.js/, /.*chunk.*\.js/],
                filename: `var/px_plugins_${themeSlug}.json`,
            }),

            new SvgStorePlugin(),

            new MiniCssExtractPlugin(miniCssChunksConfig),
        ],
    };
};
