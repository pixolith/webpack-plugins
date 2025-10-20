const config = require('./config');

const Path = require('path'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    ChangeCase = require('change-case'),
    Consola = require('consola'),
    Sw6PluginMapEmitterPlugin = require('@pixolith/webpack-sw6-plugin-map-emitter'),
    Entry = require('webpack-glob-entry'),
    SvgStorePlugin = require('@pixolith/external-svg-sprite-loader'),
    outputConfig = {
        path: config.outputPath,
        publicPath: config.assetUrl,
        chunkFilename: (chunkData) => {
            return `js/chunk[name]${
                config.isProd ? '.[contenthash]' : ''
            }.js`;
        },
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${
                config.isProd ? `.[contenthash]` : ''
            }.js`;
        },
    },
    miniCssChunksConfig = {
        filename: `css/[name]${
            config.isProd ? '.[contenthash]' : ''
        }.css`,
        chunkFilename: `css/[name].vendor${
            config.isProd ? '.[contenthash]' : ''
        }.css`
    };

module.exports = {
    entry: () => {
        let entriesPlugins = Entry(
            (filePath) =>
                ChangeCase.kebabCase(
                    filePath.match(config.pluginMatch)[1],
                ),
            Path.resolve(config.pluginSrcPath, 'index.js'),
        );

        let entriesVendor = Entry(
            (filePath) =>
                ChangeCase.kebabCase(
                    filePath.match(config.vendorMatch)[1],
                ),
            Path.resolve(config.vendorSrcPath, 'index.js'),
        );

        let routeSplitEntriesPlugins = Entry(
            (filePath) => filePath.split('/').pop().replace('.index.scss', '').replace('.', '_'),
            Path.resolve(config.pluginRouteSplitPath, '*index.scss'),
        );
        let routeSplitEntriesVendor = Entry(
            (filePath) => filePath.split('/').pop().replace('.index.scss', '').replace('.', '_'),
            Path.resolve(config.vendorRouteSplitPath, '*index.scss'),
        );

        if (config.isDebug) {
            Consola.info('[DEBUG]: Webpack entry points:');
            console.table({ ...entriesPlugins, ...entriesVendor, ...routeSplitEntriesPlugins, ...routeSplitEntriesVendor });
        }

        return { ...entriesPlugins, ...entriesVendor, ...routeSplitEntriesPlugins, ...routeSplitEntriesVendor };
    },
    module: {
        rules: [
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
                                targets: require('browserslist').loadConfig({
                                    config: './package.json',
                                }),
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
                    filename: 'img/[name][ext]'
                }
            },
            {
                test: /\.(eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]'
                }
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: SvgStorePlugin.loader,
                        options: {
                            name: 'sprite/sprite.svg',
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
        }),

        new SvgStorePlugin(),

        new MiniCssExtractPlugin(miniCssChunksConfig),
    ],
};
