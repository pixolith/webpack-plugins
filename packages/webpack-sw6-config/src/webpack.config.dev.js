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
    Glob = require('glob'),
    isModern = process.env.MODE === 'modern',
    HookPlugin = require('@pixolith/webpack-hook-plugin');

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
                    configFile: Path.resolve(__dirname, '.eslintrc.js'),
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
                use: [
                    {
                        loader: 'html-loader',
                    },
                ],
            },
            {
                test: /\.js$/,
                loader: 'string-replace-loader',
                options: {
                    search:
                        "import PluginManager from 'src/plugin-system/plugin.manager'",
                    //match, p1, offset, string
                    replace: () => 'const PluginManager = window.PluginManager',
                    flags: 'g',
                },
            },
        ],
    },
    devServer: {
        disableHostCheck: true,
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
            beforeCompile(compiler, callback) {
                let path = Path.join(process.cwd(), 'www/public/sprite'),
                    filename = 'sprite.svg',
                    exists = fs.existsSync(path);

                if (!exists) {
                    fs.mkdirSync(path, {
                        recursive: true,
                    });
                    fs.appendFile(Path.join(path, filename), '#', (err) => {
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
            ignoreFiles: [/node_modules/, /vendor\/shopware/, /.*\.plugin\.js/],
            rules: {
                // check cases here https://github.com/blakeembrey/change-case
                scss: 'paramCase',
                js: 'paramCase',
                woff: 'paramCase',
                woff2: 'paramCase',
                svg: 'paramCase',
            },
        }),

        new WriteFilePlugin({
            exitOnErrors: false,
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
    ].concat(
        Glob.sync(Path.join(privatePath, '/**/*.s?(a|c)ss')).length
            ? new StyleLintPlugin({
                  files: '**/Pxsw*/**/*.s?(a|c)ss',
                  failOnError: false,
                  fix: false,
                  configFile: Path.join(__dirname, 'stylelint.config.js'),
              })
            : [],
    ),
    watch: false,
    stats: 'errors-warnings',
};
