const webpack = require('webpack'),
    path = require('path'),
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    WriteFilePlugin = require('write-file-webpack-plugin'),
    basePath = process.env.PLUGIN_PATH,
    Consola = require('consola'),
    publicPath = process.env.PUBLIC_PATH,
    isModern = process.env.MODE === 'modern',
    glob = require('glob'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    watcher = require('@pixolith/webpack-watcher');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: {
        [process.env.MODE || 'app']: path.resolve(basePath, 'index.js'),
    },
    resolve: {
        modules: ['node_modules', path.resolve(basePath, 'Js')],
    },
    devtool: 'inline-cheap-module-source-map',
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
                    configFile: path.resolve(__dirname, '.eslintrc.js'),
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
                            config: {
                                path: path.join(__dirname),
                                ctx: {
                                    mode: 'frontend',
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
                test: /(\.less)$/,
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
                            config: {
                                path: path.join(__dirname),
                                ctx: {
                                    mode: 'frontend',
                                    isModern: isModern,
                                },
                            },
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
                test: /\.(html)$/,
                use: 'html-loader',
            },
            {
                test: /\.png|\.jpg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 100000,
                            outputPath: 'Images',
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
                            outputPath: 'Fonts',
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'Icons',
                        },
                    },
                    {
                        loader: 'svgo-loader',
                        options: {
                            plugins: [
                                { removeViewBox: false },
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
        path: path.join(process.cwd(), 'public', publicPath),
        publicPath: path.join(publicPath, '/'),
        filename: 'Js/[name].js',
    },
    optimization: {
        namedModules: true,
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // exclude all css because of a bug with css chunking order
                    test: /[\\/]node_modules[\\/](?!resetcss)/,
                    name: 'vendor_' + process.env.MODE,
                    chunks: 'all',
                },
            },
        },
    },
    devServer: {
        disableHostCheck: true,
        host: '0.0.0.0',
        sockHost: 'node.px-staging.de',
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
        stats: 'errors-warnings',
        after() {
            if (!isProd) {
                Consola.success(
                    `Starting webpack in [${process.env.NODE_ENV}] mode`,
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
        }),

        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),

        new WriteFilePlugin({
            exitOnErrors: false,
            test: /^(?!.*(hot)).*/,
        }),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development',
            ),
        }),

        new ExtractCssChunks({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: 'Css/[name].css',
            chunkFilename: 'Css/[id].css',
            hot: false,
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
    ].concat(
        glob.sync(path.join(basePath, 'Scss/**/*.scss')).length
            ? new StyleLintPlugin({
                  files: glob.sync(path.join(basePath, 'Scss/**/*.scss')),
                  failOnError: false,
                  configFile: path.join(__dirname, 'stylelint.config.js'),
              })
            : [],
    ),
    watch: false,
    stats: {
        colors: true,
    },
};
