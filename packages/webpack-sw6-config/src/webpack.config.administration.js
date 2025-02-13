import config from './config.js';
import Path from 'path';
import Fs from 'fs';
import Entry from 'webpack-glob-entry';
import * as ChangeCase from 'change-case';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Consola from 'consola';
import AssetsCopyPlugin from '@pixolith/webpack-assets-copy-plugin';
import SvgStorePlugin from '@pixolith/external-svg-sprite-loader';

const __dirname = import.meta.dirname;

const outputConfig = {
        path: config.outputPath,
        publicPath: '/',
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name
                .toLowerCase()
                .replace('vendor-', '')
                .replace('pxsw-pxsw-', 'pxsw-');
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/js/${pluginName}.js`;
        }
    },
    miniCssChunksConfig = {
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name
                .toLowerCase()
                .replace('vendor-', '')
                .replace('pxsw-pxsw-', 'pxsw-');
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/css/${pluginName}.css`;
        }
    }

export default {
    entry: () => {
        let entriesPlugins = Entry(
            (filePath) =>
                ChangeCase.kebabCase(
                    filePath.match(config.pluginMatch)[1],
                ),
            Path.join(config.pluginSrcPath, 'index.js'),
        );

        let entriesVendor = Entry(
            (filePath) =>
                ChangeCase.kebabCase(
                    filePath.match(config.vendorMatch)[1],
                ),
            Path.resolve(config.vendorSrcPath, 'index.js'),
        );

        if (process.env.DEBUG) {
            Consola.info('[DEBUG]: Webpack entry points:');
            console.table({...entriesPlugins, ...entriesVendor });
        }

        console.table({...entriesPlugins, ...entriesVendor });

        return {...entriesPlugins, ...entriesVendor };
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => /node_modules/.test(file),
                loader: 'babel-loader',
                options: {
                    configFile: Path.resolve(__dirname, 'babel.config.js'),
                },
            },
            {
                test: /\.(jpe?g|png|gif|ico)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: '../img/[name][ext]'
                }
            },
            {
                test: /\.(eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
                generator: {
                    filename: '../fonts/[name][ext]'
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
        new SvgStorePlugin(),
        new MiniCssExtractPlugin(miniCssChunksConfig),
    ].concat(
        config.isProd ?
            new AssetsCopyPlugin({
                includes: ['js', 'css'],
                ignoreFiles: [/[-\w.]*.hot-update.js/],
                files: [
                    {
                        from: config.outputPath,
                        to: '$pluginPath/$plugin/src/Resources/public',
                        replace: async (fromPath, toPath) => {
                            let composerPluginName = Path.basename(fromPath).replace(
                                    Path.extname(fromPath),
                                    '',
                                ).replace('pxsw-', ''),
                                pluginName = 'Pxsw' + ChangeCase.pascalCase(composerPluginName);

                            let isPlugin = await Fs.existsSync(`custom/plugins/${pluginName}/src`),
                                isStaticPlugin = await Fs.existsSync(`custom/static-plugins/${pluginName}/src`);

                            let pluginFolder = isPlugin ? 'custom/plugins' : (isStaticPlugin ? 'custom/static-plugins' : 'vendor/pxsw');

                            toPath = toPath.replace('$pluginPath', pluginFolder);
                            if (!isPlugin && !isStaticPlugin) {
                                let isDoublePxswPlugin = await Fs.existsSync(`vendor/pxsw/pxsw-${composerPluginName}/src`);
                                toPath = toPath.replace('$plugin', isDoublePxswPlugin ? `pxsw-${composerPluginName}` : composerPluginName);
                            } else {
                                toPath = toPath.replace('$plugin', pluginName);
                            }

                            return toPath;
                        },
                    },
                ],
            }) : [],
    ),

    optimization: {
        splitChunks: false,
    },
};
