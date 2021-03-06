const Path = require('path'),
    Fs = require('fs'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    privatePath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    ChangeCase = require('change-case'),
    Consola = require('consola'),
    TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin'),
    entry = require('webpack-glob-entry'),
    isProd = process.env.NODE_ENV === 'production',
    isModern = process.env.MODE === 'modern',
    SvgStorePlugin = require('external-svg-sprite-loader'),
    publicPath = 'public',
    ASSET_URL = process.env.ASSET_URL || '/',
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    outputConfig = {
        path: Path.join(process.cwd(), publicPath),
        publicPath: ASSET_URL,
        chunkFilename: `js/[name]${
            isModern ? '.modern' : '' + isProd ? '.[contenthash]' : ''
        }.js`,
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${(isModern
                ? '.modern'
                : '') + (isProd ? `.${chunkData.chunk.hash}` : '')}.js`;
        },
    },
    extractCssChunksConfig = {
        filename: `css/[name]${isModern ? '.modern' : ''}${
            isProd ? '.[contenthash]' : ''
        }.css`,
        chunkFilename: `css/[name].vendor${isModern ? '.modern' : ''}${
            isProd ? '.[contenthash]' : ''
        }.css`,
        hot: !isProd,
    };

module.exports = {
    entry: () => {
        let entriesPlugins = entry(
            (filePath) =>
                ChangeCase.paramCase(
                    filePath.match(/plugins\/(Pxsw[\w]*)\//)[1],
                ),
            Path.resolve(privatePath, 'index.js'),
        );

        let entriesVendor = entry(
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
            Path.resolve(
                './vendor/shopware/storefront/Resources/app/storefront/vendor',
            ),
        ],
        alias: {
            src: Path.join(
                process.cwd(),
                '/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
        },
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => {
                    if (
                        !isModern &&
                        /node_modules/.test(file) &&
                        JSON.parse(process.env.JS_TRANSPILE) &&
                        JSON.parse(process.env.JS_TRANSPILE).length &&
                        JSON.parse(process.env.JS_TRANSPILE).filter((lib) => {
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
                let path = Path.join(process.cwd(), publicPath, 'sprite'),
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
                    process.cwd(),
                    publicPath,
                    'sprite/sprite.svg',
                );
                let spriteOutputPath = Path.join(
                        process.cwd(),
                        'custom/plugins/PxswTheme/src/Resources/views/storefront',
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
                [isModern ? 'scriptsmodern' : 'scripts']: {
                    namespace: '@Storefront/storefront',
                    path: '',
                    filename: isModern
                        ? '_px_base_modern.html.twig'
                        : '_px_base.html.twig',
                },
                [isModern ? 'stylesmodern' : 'styles']: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: isModern
                        ? '_px_meta_modern.html.twig'
                        : '_px_meta.html.twig',
                },
                [isModern ? 'hintsmodern' : 'hints']: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: isModern
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
