const config = require('./config');

const Path = require('path'),
    Fs = require('fs'),
    changeCase = require('change-case'),
    entry = require('webpack-glob-entry'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    SvgStorePlugin = require('external-svg-sprite-loader'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    outputConfig = {
        path: config.outputPath,
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
    },
    extractCssChunksConfig = {
        moduleFilename: ({ name }) => {
            let pluginName = name.replace('vendor-', '').toLowerCase();
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/css/${pluginName}.css`;
        },
        hot: !config.isProd,
    };

module.exports = {
    entry: () => {
        let entriesPlugins = entry(
            (filePath) =>
                changeCase.paramCase(
                    filePath.match(config.pluginMatch)[1],
                ),
            Path.join(config.pluginSrcPath, 'index.js'),
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
                test: /\.png|\.jpg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 100000,
                            outputPath: '../images',
                        },
                    },
                ],
            },
            {
                test: /(\.woff|\.woff2)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: '../fonts',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: SvgStorePlugin.loader,
                        options: {
                            name: 'sprite/sprite.svg',
                            iconName: '[name]',
                        },
                    },
                    {
                        loader: 'svgo-loader',
                        options: {
                            plugins: [
                                // don't enable this
                                { removeViewBox: false },
                                //
                                { cleanupAttrs: true },
                                { removeDoctype: true },
                                { removeXMLProcInst: true },
                                { cleanupEnableBackground: true },
                                { convertStyleToAttrs: true },
                                { convertPathData: true },
                                { cleanupIDs: false },
                                { minifyStyles: true },
                                { removeUselessDefs: true },
                                { convertShapeToPath: true },
                                { removeUnusedNS: true },
                                { removeDimensions: true },
                                { convertTransform: true },
                                { collapseGroups: true },
                                { removeComments: true },
                                { removeEditorsNSData: true },
                                { removeUnknownsAndDefaults: true },
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
                let path = Path.join(config.outputPath, 'sprite'),
                    filename = 'sprite.svg',
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
                    config.outputPath,
                    'sprite/sprite.svg',
                );
                let spriteOutputPath = Path.join(
                        config.spriteOutputPath,
                        'administration',
                    ),
                    spritOutputFilename = '_sprite.svg';

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
            ignoreFiles: [/[-\w.]*.hot-update.js/, /sprite\/sprite.svg/],
            files: [
                {
                    from: config.outputPath,
                    to: 'custom/plugins/$plugin/src/Resources/public',
                    replace: (fromPath, toPath) => {
                        let pluginName = changeCase.pascalCase(
                            Path.basename(fromPath).replace(
                                Path.extname(fromPath),
                                '',
                            ),
                        );

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

        new ExtractCssChunks(extractCssChunksConfig),
    ],

    optimization: {
        splitChunks: false,
    },
};
