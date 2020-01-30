const webpack = require('webpack'),
    path = require('path'),
    consola = require('consola'),
    fs = require('fs'),
    OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    WriteFilePlugin = require('write-file-webpack-plugin'),
    transpileLibrariesList = require('./webpack.config.transpile'),
    privatePath = process.env.PLUGIN_PATH,
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    watcher = require('@pixolith/webpack-watcher'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    outputConfig = {
        path: path.resolve(__dirname, 'www/public/bundles'),
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
    };

let runBefore = () => {
    consola.info('Cleaning and Building index files');
    watcher.clean();
    watcher.run();
};

runBefore();

module.exports = {
    target: 'web',
    mode: 'development',
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
                __dirname,
                '/www/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
        },
    },
    devtool: 'inline-cheap-module-source-map',
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) =>
                    /node_modules/.test(file) &&
                    !transpileLibrariesList.find((lib) => lib.test(file)),
                loader: 'babel-loader',
                options: {
                    configFile: path.resolve(__dirname, 'babel.config.js'),
                },
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                exclude: (file) => /node_modules/.test(file),
                enforce: 'pre',
                options: {
                    formatter: require('eslint-friendly-formatter'),
                },
            },
            {
                test: /(\.scss|\.css)$/,
                use: [
                    process.env.NODE_ENV === 'production'
                        ? ExtractCssChunks.loader
                        : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: !isProd,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: !isProd,
                            config: {
                                ctx: {
                                    mode: process.env.SHOPWARE_MODE,
                                },
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !isProd,
                        },
                    },
                    {
                        loader: 'sass-resources-loader',
                        options: {
                            resources: process.env.RESOURCES_PATHS,
                        },
                    },
                ],
            },
            {
                test: /\.(html|twig)$/,
                use: 'html-loader',
            },
            {
                test: /\.png$/,
                use: 'url-loader?limit=100000',
            },
            {
                test: /\.jpg$/,
                use: 'file-loader',
            },
            {
                test: /(\.woff|\.woff2)$/,
                use: 'file-loader',
            },
        ],
    },
    output: outputConfig,
    optimization: {
        splitChunks: false,
    },
    devServer: {
        disableHostCheck: true,
        sockHost: 'node.px-staging.de',
        watchOptions: {
            aggregateTimeout: 500,
        },
        watchContentBase: false,
        sockPort: 8080,
        overlay: {
            warnings: true,
            errors: true,
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods':
                'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers':
                'X-Requested-With, content-type, Authorization',
        },
        stats: 'errors-only',
        https: {
            key: fs.readFileSync(
                __dirname +
                    '/ansible/shopware6/roles/apache/files/px-staging.de.key',
            ),
            cert: fs.readFileSync(
                __dirname +
                    '/ansible/shopware6/roles/apache/files/px-staging.de.crt',
            ),
            ca: fs.readFileSync(
                __dirname +
                    '/ansible/shopware6/roles/apache/files/intermediate.crt',
            ),
        },
        after() {
            if (!isProd) {
                console.log('Starting watcher');
                watcher.watch();
            }
        },
    },
    plugins: [
        new HookPlugin({
            failed() {
                watcher.run();
            },
            beforeRun() {
                console.log('Cleaning output folder');
                watcher.clean();
                watcher.run();
            },
        }),

        new WriteFilePlugin({
            exitOnErrors: false,
        }),

        new StyleLintPlugin({
            files: [path.join(privatePath, '/**/*.scss')],
            failOnError: false,
        }),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development',
            ),
        }),

        new OptimizeCssAssetsPlugin({
            cssProcessor: require('cssnano'),
            cssProcessorOptions: {
                preset: [
                    'default',
                    {
                        discardComments: {
                            removeAll: true,
                        },
                    },
                ],
            },
        }),
    ],
    watch: false,
    stats: 'errors-warnings',
};
