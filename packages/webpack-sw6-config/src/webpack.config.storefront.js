const Path = require('path'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    privatePath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    ChangeCase = require('change-case'),
    TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin'),
    entry = require('webpack-glob-entry'),
    isProd = process.env.NODE_ENV === 'production',
    isModern = process.env.MODE === 'modern',
    outputConfig = {
        path: Path.join(process.cwd(), 'www/public'),
        publicPath: '/',
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

const createEntry = () => {
    let entriesPlugins = entry(
        (filePath) =>
            ChangeCase.paramCase(filePath.match(/plugins\/(Pxsw[\w]*)\//)[1]),
        Path.resolve(privatePath, 'index.js'),
    );

    let entriesVendor = entry(
        (filePath) =>
            ChangeCase.paramCase(filePath.match(/(vendor\/pxsw\/[\w-]*)\//)[1]),
        Path.resolve(vendorPath, 'index.js'),
    );

    return { ...entriesPlugins, ...entriesVendor };
};

module.exports = {
    entry: createEntry(),
    resolve: {
        modules: [
            'node_modules',
            Path.resolve(privatePath, 'js'),
            Path.resolve(
                './www/vendor/shopware/storefront/Resources/app/storefront/vendor',
            ),
        ],
        alias: {
            src: Path.join(
                process.cwd(),
                '/www/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
            '@swStorefront': Path.join(process.cwd()),
            '@swBootstrap': Path.join(
                process.cwd(),
                '/www/vendor/shopware/storefront/Resources/app/storefront/vendor/bootstrap/scss',
            ),
        },
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => {
                    if (/node_modules/.test(file)) {
                        return true;
                    }

                    if (
                        !isModern &&
                        JSON.parse(process.env.JS_TRANSPILE) &&
                        JSON.parse(process.env.JS_TRANSPILE).length
                    ) {
                        return (
                            JSON.parse(process.env.JS_TRANSPILE).filter((lib) =>
                                lib.test(file),
                            ).length > 0
                        );
                    }

                    return false;
                },
                use: {
                    loader: 'babel-loader',
                    options: {
                        configFile: Path.resolve(__dirname, 'babel.config.js'),
                    },
                },
            },
        ],
    },
    output: outputConfig,
    plugins: [
        new TwigAssetEmitterPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [],
            template: {
                [isModern ? 'scriptsmodern' : 'scripts']: {
                    namespace: '@Storefront/storefront',
                    path: '',
                    filename: '_px_base.html.twig',
                },
                [isModern ? 'stylesmodern' : 'styles']: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: '_px_meta.html.twig',
                },
                hints: {
                    namespace: '@Storefront/storefront',
                    path: 'layout',
                    filename: '_px_meta.html.twig',
                },
            },
        }),

        new ExtractCssChunks(extractCssChunksConfig),
    ],
};
