const path = require('path'),
    privatePath = process.env.PLUGIN_PATH,
    changeCase = require('change-case'),
    entry = require('webpack-glob-entry'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    outputConfig = {
        futureEmitAssets: true,
        path: path.resolve(process.cwd(), 'www/public/bundles'),
        publicPath: './',
        chunkFilename: 'js/admin-[name].vendor.js',
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
        chunkFilename: 'css/admin-[name].vendor.css',
        hot: process.env.NODE_ENV === 'development',
    };

const createEntry = () => {
    let entriesPlugins = entry(
        (filePath) =>
            changeCase.paramCase(filePath.match(/plugins\/(Pxsw[\w]*)\//)[1]),
        path.resolve(privatePath, 'index.js'),
    );

    return { ...entriesPlugins };
};

module.exports = {
    entry: createEntry(),
    performance: {
        maxEntrypointSize: 300000,
        hints: false,
    },
    resolve: {
        modules: [
            'node_modules',
            path.resolve(privatePath, 'js'),
            path.resolve(
                './www/vendor/shopware/storefront/Resources/app/storefront/vendor',
            ),
        ],
        alias: {
            src: path.join(
                process.cwd(),
                '/www/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
        },
    },
    output: outputConfig,
    plugins: [
        new AssetsCopyPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/\*.hot-update.js/],
            from: 'www/public/bundles',
            to: 'www/custom/plugins/{plugin}/src/Resources/public',
        }),

        new ExtractCssChunks(extractCssChunksConfig),
    ],
};
