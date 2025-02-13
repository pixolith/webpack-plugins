import config from './config.js';
import Path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as  ChangeCase from 'change-case';
import Consola from 'consola';
import Sw6PluginMapEmitterPlugin from '@pixolith/webpack-sw6-plugin-map-emitter';
import Entry from 'webpack-glob-entry';
import SvgStorePlugin from '@pixolith/external-svg-sprite-loader';
import browserList from 'browserslist';

const outputConfig = {
    path: config.outputPath,
    publicPath: config.assetUrl,
    chunkFilename: (chunkData) => {
        return `js/chunk[name]${config.isProd ? '.[contenthash]' : ''}.js`;
    },
    filename: (chunkData) => {
        return `js/${chunkData.chunk.name.toLowerCase()}${config.isProd ? `.[contenthash]` : ''}.js`;
    },
};

const miniCssChunksConfig = {
    filename: `css/[name]${config.isProd ? '.[contenthash]' : ''}.css`,
    chunkFilename: `css/[name].vendor${config.isProd ? '.[contenthash]' : ''}.css`
};

export default {
    entry: () => {
        let entriesPlugins = Entry(
            (filePath) => ChangeCase.kebabCase(filePath.match(config.pluginMatch)[1]),
            Path.resolve(config.pluginSrcPath, 'index.js')
        );

        let entriesVendor = Entry(
            (filePath) => ChangeCase.kebabCase(filePath.match(config.vendorMatch)[1]),
            Path.resolve(config.vendorSrcPath, 'index.js')
        );

        let routeSplitEntriesPlugins = Entry(
            (filePath) => filePath.split('/').pop().replace('.index.scss', '').replace('.', '_'),
            Path.resolve(config.pluginRouteSplitPath, '*index.scss')
        );

        let routeSplitEntriesVendor = Entry(
            (filePath) => ChangeCase.paramCase(filePath.match(config.vendorMatch)[1]),
            Path.resolve(config.vendorRouteSplitPath, 'route-splitting/*/*index.scss')
        );

        //let coreEntries = Entry(
        //    (filePath) => 'storefront',
        //    Path.resolve('vendor/shopware/storefront/Resources/app/storefront/src/scss', 'base.scss')
        //);

        //let match = new RegExp(`vendor\/store.shopware.com\/([\\w-]*)\/`);
        //let pluginEntries = Entry(
        //    (filePath) => filePath.match(match)[1].toLowerCase(),
        //    Path.resolve('vendor/store.shopware.com/*/src/Resources/app/storefront/src/scss', 'base.scss')
        //);

        if (config.isDebug) {
            Consola.info('[DEBUG]: Webpack entry points:');
            console.table({...entriesPlugins, ...entriesVendor, ...routeSplitEntriesPlugins, ...routeSplitEntriesVendor});
        }

        //return {...entriesPlugins, ...entriesVendor, ...routeSplitEntriesPlugins, ...routeSplitEntriesVendor, ...coreEntries, ...pluginEntries};
        return {...entriesPlugins, ...entriesVendor, ...routeSplitEntriesPlugins, ...routeSplitEntriesVendor};
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => /node_modules/.test(file),
                use: [
                    {
                        loader: 'swc-loader',
                        options: {
                            env: {
                                mode: 'entry',
                                coreJs: '3.34.0',
                                // .browserlist settings are not found by swc-loader, so we load it manually: https://github.com/swc-project/swc/issues/3365
                                targets: browserList.loadConfig({
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
