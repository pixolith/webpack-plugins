const webpack = require('webpack'),
    path = require('path'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    WriteFilePlugin = require('write-file-webpack-plugin'),
    basePath = process.env.PLUGIN_PATH,
    privatePath = path.join(basePath, 'Private'),
    publicPath = path.join(basePath, 'Public'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    watcher = require('@pixolith/webpack-watcher');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: {
        scripts: path.resolve(privatePath, 'Src/Js/index.js'),
    },
    performance: {
        maxEntrypointSize: 300000,
        hints: false,
    },
    resolve: {
        modules: ['node_modules', path.resolve(privatePath, 'Src/Js')],
    },
    devtool: 'inline-cheap-module-source-map',
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => {
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
                },
                loader: 'babel-loader',
                options: {
                    configFile: path.resolve(__dirname, 'babel.config.js'),
                },
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                exclude: /node_modules/,
                enforce: 'pre',
                options: {
                    formatter: require('eslint-friendly-formatter'),
                },
            },
            {
                test: /(\.scss|\.css)$/,
                use: [
                    ExtractCssChunks.loader,
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
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !isProd,
                        },
                    },
                ],
            },
            {
                test: /(\.less|\.css)$/,
                use: [
                    ExtractCssChunks.loader,
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
                        },
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: !isProd,
                        },
                    },
                ],
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
                test: /\.woff$/,
                use: 'file-loader',
            },
            {
                test: require.resolve('jquery'),
                use: [
                    {
                        loader: 'expose-loader',
                        options: 'jQuery',
                    },
                    {
                        loader: 'expose-loader',
                        options: '$',
                    },
                ],
            },
        ],
    },
    output: {
        path: path.join(__dirname, publicPath, '/'),
        publicPath: path.join(publicPath, '/'),
        filename: 'Js/[name].min.js',
    },
    optimization: {
        namedModules: true,
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // exclude all css because of a bug with css chunking order
                    test: /[\\/]node_modules[\\/](?!resetcss)/,
                    name: 'vendor',
                    chunks: 'all',
                },
            },
        },
    },
    devServer: {
        disableHostCheck: true,
        host: '0.0.0.0',
        proxy: {
            '/': 'http://vagrant.pixolith.de',
        },
        stats: 'errors-only',
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

        new WebpackShellPlugin({
            safe: true,
            onBuildEnd: [
                'node ./generate-static-files ./www/typo3conf/ext/px_basis_config/Resources/Private/Src/Sass',
                'node ./generate-static-files ./www/typo3conf/ext/px_basis_config/Resources/Private/Src/Js',
            ],
        }),

        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),

        new WriteFilePlugin({
            exitOnErrors: false,
            test: /^(?!.*(hot)).*/,
        }),

        new StyleLintPlugin({
            files: [
                './www/typo3conf/ext/px_basis_config/Resources/Private/Src/Sass/Globals/**',
                './www/typo3conf/ext/px_basis_config/Resources/Private/Src/Sass/Modules/**',
            ],
            failOnError: false,
        }),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development',
            ),
        }),

        new ExtractCssChunks({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'Css/styles.min.css',
            hot: false,
        }),

        //new BundleAnalyzerPlugin(),

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
    stats: {
        colors: true,
    },
};
