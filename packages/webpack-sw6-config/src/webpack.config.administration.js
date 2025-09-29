const config = require('./config');

const Path = require('path'),
    Fs = require('fs'),
    Entry = require('webpack-glob-entry'),
    ChangeCase = require('change-case'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    Consola = require('consola'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    SvgStorePlugin = require('@pixolith/external-svg-sprite-loader'),
    TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin'),
    outputConfig = {
        path: config.outputPath,
        publicPath: '/',
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name.toLowerCase().replace('pxsw-pxsw-', 'pxsw-');
            pluginName = config.shopwareVersion === '6.6' ? pluginName.replace('vendor-', '') : pluginName;
            return config.shopwareVersion === '6.6' ?
                `${pluginName.replace(/-/g, '',)}/administration/js/${pluginName}.js` :
                `js/${pluginName}${
                    config.isProd ? '.admin.[contenthash]' : ''
                }.js`;
        }
    },
    miniCssChunksConfig = {
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name.toLowerCase().replace('pxsw-pxsw-', 'pxsw-');
            pluginName = config.shopwareVersion === '6.6' ? pluginName.replace('vendor-', '') : pluginName;
            return config.shopwareVersion === '6.6' ?
                `${pluginName.replace(/-/g, '',)}/administration/css/${pluginName}.css` :
                `css/${pluginName}${
                    config.isProd ? '.admin.[contenthash]' : ''
                }.css`;
        }
    }

module.exports = {
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

        return {...entriesPlugins, ...entriesVendor };
    },
    module: {
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
        config.isProd && config.shopwareVersion === '6.6' ?
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
    ).concat(
        config.isProd && config.shopwareVersion !== '6.6' ?
        new TwigAssetEmitterPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/.*icons.*\.js/],
            template: {
                admin: {
                    assetUrl: config.assetUrl,
                    filename: 'index.html.twig',
                },
            },
        }) : [],
    ),

    optimization: {
        splitChunks: false,
    },
};
