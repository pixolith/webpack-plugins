const Path = require('path'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    privatePath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    ChangeCase = require('change-case'),
    TwigAssetEmitterPlugin = require('@pixolith/webpack-twig-assets-emitter-plugin'),
    entry = require('webpack-glob-entry'),
    outputConfig = {
        path: Path.join(process.cwd(), 'www/public'),
        publicPath: '/',
        chunkFilename: 'js/[name].vendor.js',
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}.js`;
        },
    },
    extractCssChunksConfig = {
        filename: 'css/[name].css',
        chunkFilename: 'css/[name].vendor.css',
        hot: process.env.NODE_ENV === 'development',
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
    output: outputConfig,
    plugins: [
        new TwigAssetEmitterPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/\*.hot-update.js/],
            template: {
                scripts: {
                    namespace: '@Storefront/storefront',
                    path: '',
                    filename: '_px_base.html.twig',
                },
                styles: {
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
