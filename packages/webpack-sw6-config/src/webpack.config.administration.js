const Path = require('path'),
    Fs = require('fs'),
    privatePath = process.env.PLUGIN_PATH,
    changeCase = require('change-case'),
    entry = require('webpack-glob-entry'),
    publicPath = process.env.PUBLIC_PATH,
    spritePath = process.env.SPRITE_PATH ?? 'custom/plugins/PxswTheme/src/Resources/views/administration',
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    SvgStorePlugin = require('@pixolith/external-svg-sprite-loader'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    outputPath = Path.resolve(process.cwd(), publicPath),
    outputConfig = {
        path: outputPath,
        publicPath: '/',
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name
                .toLowerCase()
                .replace('vendor-', '');
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/js/${pluginName}.js`;
        },
        cssFilename: (chunkData) => {
            let pluginName = chunkData.chunk.name
                .toLowerCase()
                .replace('vendor-', '');
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/css/${pluginName}.css`;
        },
    }

module.exports = {
    entry: () => {
        let entriesPlugins = entry(
            (filePath) =>
                changeCase.paramCase(
                    filePath.match(/plugins\/(Pxsw[\w]*)\//)[1],
                ),
            Path.resolve(privatePath, 'index.js'),
        );

        return { ...entriesPlugins };
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
                            name: 'sprite/sprite_uses.svg',
                            iconName: '[name]',
                            onlySymbols: false,
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
        new HookPlugin({
            beforeCompile(compiler, callback) {
                let path = Path.join(process.cwd(), publicPath, 'sprite'),
                    filename = 'sprite_uses.svg',
                    exists = Fs.existsSync(Path.join(path, filename));

                if (!exists) {
                    Fs.mkdirSync(path, {
                        recursive: true,
                    });
                    Fs.appendFile(Path.join(path, filename), '#', (err) => {
                        if (err) {
                            throw err;
                        }
                    });
                }

                callback();
            },

            afterEmit(compiler, callback) {
                let spriteInputPath = Path.join(
                    process.cwd(),
                    publicPath,
                    'sprite/sprite_uses.svg',
                );
                let spriteOutputPath = Path.join(
                        process.cwd(),
                        spritePath,
                    ),
                    spritOutputFilename = '_sprite_uses.svg';

                let exists = Fs.existsSync(spriteOutputPath);

                if (!exists) {
                    Fs.mkdirSync(spriteOutputPath, {
                        recursive: true,
                    });
                }

                Fs.copyFileSync(
                    spriteInputPath,
                    Path.join(spriteOutputPath, spritOutputFilename),
                );
                callback();
            },
        }),
        new AssetsCopyPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/[-\w.]*.hot-update.js/, /sprite\/sprite_uses.svg/],
            files: [
                {
                    from: publicPath,
                    to: 'custom/$pluginFolder/$plugin/src/Resources/public',
                    replace: async (fromPath, toPath) => {
                        let pluginName = changeCase.pascalCase(
                            Path.basename(fromPath).replace(
                                Path.extname(fromPath),
                                '',
                            ),
                        );

                        const pluginOrStaticPlugin = await Fs.existsSync('custom/plugins/$plugin/src'.replace('$plugin', pluginName));

                        let pluginFolder = pluginOrStaticPlugin ? 'plugins' : 'static-plugins';

                        toPath = toPath.replace('$pluginFolder', pluginFolder);
                        toPath = toPath.replace('$plugin', pluginName);
                        return toPath;
                    },
                },
            ],
        }),

        new SvgStorePlugin({
            sprite: {
                startX: 10,
                startY: 10,
                deltaX: 20,
                deltaY: 20,
                iconHeight: 48,
            },
        }),

        new MiniCssExtractPlugin({
            filename: outputConfig.cssFilename,
        }),
    ],

    optimization: {
        splitChunks: false,
    },
};
