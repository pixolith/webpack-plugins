const config = require('./config');

const Path = require('path'),
    Fs = require('fs'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    ChangeCase = require('change-case'),
    Consola = require('consola'),
    TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin'),
    entry = require('webpack-glob-entry'),
    SvgStorePlugin = require('external-svg-sprite-loader'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    outputConfig = {
        path: config.outputPath,
        publicPath: config.assetUrl,
        chunkFilename: `js/[name]${
            config.isModern ? '.modern' : '' + config.isProd ? '.[contenthash]' : ''
        }.js`,
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${(config.isModern
                ? '.modern'
                : '') + (config.isProd ? `.${chunkData.chunk.hash}` : '')}.js`;
        },
    },
    extractCssChunksConfig = {
        filename: `css/[name]${config.isModern ? '.modern' : ''}${
            config.isProd ? '.[contenthash]' : ''
        }.css`,
        chunkFilename: `css/[name].vendor${config.isModern ? '.modern' : ''}${
            config.isProd ? '.[contenthash]' : ''
        }.css`,
        hot: !config.isProd,
    };

module.exports = {
    entry: () => {
        let entriesPlugins = entry(
            (filePath) =>
                ChangeCase.paramCase(
                    filePath.match(config.pluginMatch)[1],
                ),
            Path.resolve(config.pluginSrcPath, 'index.js'),
        );

        let entriesVendor = entry(
            (filePath) =>
                ChangeCase.paramCase(
                    filePath.match(config.vendorMatch)[1],
                ),
            Path.resolve(config.vendorSrcPath, 'index.js'),
        );

        if (config.isDebug) {
            Consola.info('[DEBUG]: Webpack entry points:');
            Consola.info({ ...entriesPlugins, ...entriesVendor });
        }

        return { ...entriesPlugins, ...entriesVendor };
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => {
                    if (
                        !config.isModern &&
                        /node_modules/.test(file) &&
                        process.env.JS_TRANSPILE &&
                        process.env.JS_TRANSPILE.split(',').filter((lib) => {
                            return new RegExp(lib).test(file);
                        }).length > 0
                    ) {
                        return false;
                    }

                    if (/node_modules/.test(file)) {
                        return true;
                    }

                    return false;
                },
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            configFile: Path.resolve(
                                __dirname,
                                'babel.config.js',
                            ),
                        },
                    },
                ],
            },
            {
                test: /\.png|\.jpg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 100000,
                            outputPath: 'images',
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
                            outputPath: 'fonts',
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
                            onlySymbols: true,
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
                        'storefront',
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
        new TwigAssetEmitterPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/.*icons.*\.js/],
            template: {
                [config.isModern ? 'scriptsmodern' : 'scripts']: {
                    namespace: '@Storefront/storefront',
                    path: '',
                    filename: config.isModern
                        ? '_px_base_modern.html.twig'
                        : '_px_base.html.twig',
                },
                [config.isModern ? 'stylesmodern' : 'styles']: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: config.isModern
                        ? '_px_meta_modern.html.twig'
                        : '_px_meta.html.twig',
                },
                [config.isModern ? 'hintsmodern' : 'hints']: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: config.isModern
                        ? '_px_meta_modern.html.twig'
                        : '_px_meta.html.twig',
                },
            },
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
};
