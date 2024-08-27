const Path = require('path'),
    Fs = require('fs'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    privatePath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    spriteOrder = process.env.SPRITE_ORDER ?? ['pxsw/basic-theme', 'PxswBasicTheme', '**', 'pxsw/customer-theme', 'PxswCustomerTheme'],
    ignoreIcons = process.env.IGNORE_ICONS ?? [],
    swNodePath = process.env.SW_NODE_PATH ?? './vendor/shopware/storefront/Resources/app/storefront/vendor',
    swAliasPath = process.env.SW_ALIAS_PATH ?? '/vendor/shopware/storefront/Resources/app/storefront/src',
    isProd = process.env.NODE_ENV === 'production',
    ChangeCase = require('change-case'),
    Consola = require('consola'),
    Sw6PluginMapEmitterPlugin = require('@pixolith/webpack-sw6-plugin-map-emitter'),
    Entry = require('webpack-glob-entry'),
    SvgStorePlugin = require('@pixolith/external-svg-sprite-loader'),
    publicPath = process.env.PUBLIC_PATH,
    ASSET_URL = process.env.ASSET_URL || '/',
    outputConfig = {
        path: Path.join(process.cwd(), publicPath),
        publicPath: ASSET_URL,
        chunkFilename: (chunkData) => {
            return `js/chunk[name]${
                isProd ? '.[contenthash:6]' : ''
            }.js`;
        },
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${
                isProd ? `.[contenthash:6]` : ''
            }.js`;
        },
    },
    miniCssChunksConfig = {
        filename: `css/[name]${
            isProd ? '.[contenthash:6]' : ''
        }.css`,
        chunkFilename: `css/[name].vendor${
            isProd ? '.[contenthash:6]' : ''
        }.css`
    };

module.exports = {
    entry: () => {
        let entriesPlugins = Entry(
            (filePath) =>
                ChangeCase.paramCase(
                    filePath.match(/plugins\/(Pxsw[\w]*)\//)[1],
                ),
            Path.resolve(privatePath, 'index.js'),
        );

        let entriesVendor = Entry(
            (filePath) =>
                ChangeCase.paramCase(
                    filePath.match(/(vendor\/pxsw\/[\w-]*)\//)[1],
                ),
            Path.resolve(vendorPath, 'index.js'),
        );

        if (process.env.DEBUG) {
            Consola.info('[DEBUG]: Webpack entry points:');
            Consola.info({ ...entriesPlugins, ...entriesVendor });
        }

        return { ...entriesPlugins, ...entriesVendor };
    },
    resolve: {
        modules: [
            'node_modules',
            Path.resolve(privatePath, 'js'),
            Path.resolve(swNodePath),
        ],
        alias: {
            src: Path.join(
                process.cwd(),
                swAliasPath,
            ),
        },
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
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
                            overrideOrder: spriteOrder,
                            ignoreIconsByName: ignoreIcons,
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
