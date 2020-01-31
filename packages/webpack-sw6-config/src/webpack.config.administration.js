const Path = require('path'),
    privatePath = process.env.PLUGIN_PATH,
    changeCase = require('change-case'),
    entry = require('webpack-glob-entry'),
    publicPath = process.env.PUBLIC_PATH,
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    isModern = process.env.MODE === 'modern',
    outputConfig = {
        futureEmitAssets: true,
        path: Path.resolve(process.cwd(), publicPath),
        publicPath: './',
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
        hot: !isProd,
    };

const createEntry = () => {
    let entriesPlugins = entry(
        (filePath) =>
            changeCase.paramCase(filePath.match(/plugins\/(Pxsw[\w]*)\//)[1]),
        Path.resolve(privatePath, 'index.js'),
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
            Path.resolve(privatePath, 'js'),
            Path.resolve(
                process.cwd(),
                'www/vendor/shopware/storefront/Resources/app/storefront/vendor',
            ),
        ],
        alias: {
            src: Path.join(
                process.cwd(),
                'www/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
        },
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
        ],
    },
    output: outputConfig,
    plugins: [
        new AssetsCopyPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/\*.hot-update.js/],
            from: publicPath,
            to: 'www/custom/plugins/{plugin}/src/Resources/public',
        }),

        new ExtractCssChunks(extractCssChunksConfig),
    ],

    optimization: {
        splitChunks: false,
    },
};
