const webpack = require('webpack'),
    Path = require('path'),
    Consola = require('consola'),
    fs = require('fs'),
    OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    WriteFilePlugin = require('write-file-webpack-plugin'),
    privatePath = process.env.PLUGIN_PATH,
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    FilenameLinterPlugin = require('@pixolith/webpack-filename-linter-plugin'),
    watcher = require('@pixolith/webpack-watcher'),
    isModern = process.env.MODE === 'modern',
    HookPlugin = require('@pixolith/webpack-hook-plugin');

let runBefore = () => {
    Consola.info('Cleaning and Building index files');
    watcher.clean();
    watcher.run();
    console.table({
        isProd: isProd,
        isModern: isModern,
        pluginPath: process.env.PLUGIN_PATH,
        publicPath: process.env.PUBLIC_PATH,
    });
};

runBefore();

module.exports = {
    target: 'web',
    mode: 'development',
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
        },
    },
    devtool: 'inline-cheap-module-source-map',
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'eslint-loader',
                exclude: (file) => /node_modules/.test(file),
                options: {
                    formatter: require('eslint-friendly-formatter'),
                },
            },
            {
                test: /(\.scss|\.css)$/,
                use: [
                    isProd ? ExtractCssChunks.loader : 'style-loader',
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
                                path: Path.join(__dirname),
                                ctx: {
                                    mode: process.env.SHOPWARE_MODE,
                                    isModern: isModern,
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
                            resources: JSON.parse(process.env.RESOURCES_PATHS),
                        },
                    },
                ],
            },
            {
                test: /\.(html|twig)$/,
                use: 'html-loader',
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
                        },
                    },
                ],
            },
        ],
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
                Path.join(
                    process.cwd() +
                        '/ansible/shopware6/roles/apache/files/px-staging.de.key',
                ),
            ),
            cert: fs.readFileSync(
                Path.join(
                    process.cwd() +
                        '/ansible/shopware6/roles/apache/files/px-staging.de.crt',
                ),
            ),
            ca: fs.readFileSync(
                Path.join(
                    process.cwd() +
                        '/ansible/shopware6/roles/apache/files/intermediate.crt',
                ),
            ),
        },
        after() {
            if (!isProd) {
                Consola.success(
                    `Starting webpack in [${process.env.NODE_ENV}] with [${process.env.SHOPWARE_MODE}]`,
                );
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
                Consola.info('Cleaning output folder');
                watcher.clean();
                watcher.run();
            },
        }),

        new FilenameLinterPlugin({
            ignoreFiles: [/node_modules/, /vendor\/shopware/, /.*\.plugin\.js/],
            rules: {
                // check cases here https://github.com/blakeembrey/change-case
                scss: 'paramCase',
                js: 'paramCase',
            },
        }),

        new WriteFilePlugin({
            exitOnErrors: false,
        }),

        new StyleLintPlugin({
            files: [Path.join(privatePath, '/**/*.scss')],
            failOnError: false,
            configFile: Path.join(__dirname, 'stylelint.config.js'),
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
