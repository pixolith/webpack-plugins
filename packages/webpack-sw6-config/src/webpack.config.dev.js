const webpack = require('webpack'),
    Path = require('path'),
    Consola = require('consola'),
    Fs = require('fs'),
    ASSET_URL = process.env.ASSET_URL || '/',
    isProd = process.env.NODE_ENV === 'production',
    privatePath = process.env.PLUGIN_PATH,
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    //MediaQueryPlugin = require('media-query-plugin'),
    FilenameLinterPlugin = require('@pixolith/webpack-filename-linter-plugin'),
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
    devtool: 'inline-cheap-module-source-map',
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /(\.scss|\.css)$/,
                use: [
                    isProd ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: !isProd,
                        },
                    },
                    //{
                    //    loader: MediaQueryPlugin.loader
                    //},
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: !isProd,
                            postcssOptions: {
                                config: Path.resolve(__dirname, 'postcss.config.js'),
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: !isProd,
                            additionalData: `$asset_url: '${ASSET_URL}';`,
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
        server: !isProd
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
            watcher.watch();

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
                let path = Path.join(process.cwd(), 'public/sprite'),
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
                watcher.run();
            },
        }),

        new FilenameLinterPlugin({
            ignoreFiles: [/node_modules/, /custom\/apps/, /vendor/],
            rules: {
                // check cases here https://github.com/blakeembrey/change-case
                scss: 'paramCase',
                js: 'paramCase',
                woff: 'paramCase',
                woff2: 'paramCase',
                svg: 'paramCase',
            },
        }),

        new TimeFixPlugin(),

        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(
                process.env.NODE_ENV || 'development',
            ),
            'process.env.ASSET_URL': JSON.stringify(ASSET_URL),
        }),

        //new MediaQueryPlugin({
        //    include: [
        //        'example'
        //    ],
        //    queries: {
        //        '@media(min-width:768px)': 'desktop',
        //        '@media(min-width:1024px)': 'desktop',
        //        '@media(min-width:1280px)': 'desktop',
        //    }
        //}),
    ],
    watch: false,
};
