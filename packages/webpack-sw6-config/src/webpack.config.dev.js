const config = require('./config');

const webpack = require('webpack'),
    Path = require('path'),
    Consola = require('consola'),
    Fs = require('fs'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    MediaQueryPlugin = require('media-query-plugin'),
    ESLintPlugin = require('eslint-webpack-plugin'),
    watcher = require('@pixolith/webpack-watcher'),
    Glob = require('glob'),
    HookPlugin = require('@pixolith/webpack-hook-plugin'),
    Sass = require('sass'),
    TimeFixPlugin = require('time-fix-plugin');

module.exports = {
    target: 'web',
    mode: 'development',
    resolve: {
        modules: [
            'node_modules',
            Path.resolve(config.shopwareVendorPath),
        ],
        alias: {
            src: Path.resolve(config.shopwarePluginPath),
        },
    },
    devtool: 'inline-cheap-module-source-map',
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /(\.scss|\.css)$/,
                use: [
                    config.isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: !config.isProd,
                        },
                    },
                    config.isProd && config.mediaQueries ? MediaQueryPlugin.loader : '',
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: !config.isProd,
                            postcssOptions: {
                                config: Path.resolve(__dirname, 'postcss.config.js'),
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !config.isProd,
                            additionalData: `$asset_url: '${config.assetUrl}';`,
                            sassOptions: {
                                quietDeps: true,
                                logger: Sass.Logger.silent,
                            },
                        },
                    },
                    {
                        loader: 'sass-resources-loader',
                        options: {
                            resources: JSON.parse(
                                process.env.RESOURCES_PATHS,
                            ).filter((path) => {
                                return Glob.sync(path).length > 0;
                            }),
                            hoistUseStatements: true
                        },
                    },
                ],
            },
            {
                test: /\.(html|twig)$/,
                use: [
                    {
                        loader: 'html-loader',
                    },
                ],
            },
        ],
    },
    stats: 'errors-warnings',
    devServer: {
        allowedHosts: 'all',
        client: {
            webSocketURL: {
                hostname: 'node.px-staging.de',
                protocol: 'wss',
                port: process.env.SHOPWARE_MODE === 'administration' ? 8080 : 8081,
            },
            overlay: {
                warnings: false,
                errors: true,
            },
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods':
                'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers':
                'X-Requested-With, content-type, Authorization',
        },
        port: process.env.SHOPWARE_MODE === 'administration' ? 8080 : 8081,
        server: !config.isProd
            ? {
                type: 'https',
                options: {
                    ca: Fs.readFileSync(
                        Path.join(
                            process.cwd() +
                            '/.ddev/ssl/_wildcard.px-staging.de+1-client.pem',
                        ),
                    ),
                    key: Fs.readFileSync(
                        Path.join(
                            process.cwd() +
                            '/.ddev/ssl/_wildcard.px-staging.de+1-key.pem',
                        ),
                    ),
                    cert: Fs.readFileSync(
                        Path.join(
                            process.cwd() +
                            '/.ddev/ssl/_wildcard.px-staging.de+1.pem',
                        ),
                    ),
                }
            }
            : 'http',
        devMiddleware: {
            writeToDisk: true,
        },
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error("webpack-dev-server is not defined")
            }

            Consola.success(
                `Starting webpack in [${process.env.NODE_ENV}] with [${process.env.SHOPWARE_MODE}]`,
            );

            watcher.watch(config);

            return middlewares;
        },
    },
    plugins: [
        new ESLintPlugin({
            exclude: [
                '**/node_modules/**',
                'vendor'
            ]
        }),
        new HookPlugin({
            beforeCompile(compiler, callback) {
                let path = Path.join(config.outputPath, 'sprite'),
                    filename = 'sprite.svg',
                    exists = Fs.existsSync(path);

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
            failed() {
                watcher.run(null, config);
            },
        }),

        new TimeFixPlugin(),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development',
            ),
            'process.env.ASSET_URL': JSON.stringify(config.assetUrl),
        }),
    ].concat(
        config.isProd && config.mediaQueries
            ? new MediaQueryPlugin({
                include: true,
                queries: JSON.parse(config.mediaQueries)
            })
            : []
    ),
    watch: false,
};
