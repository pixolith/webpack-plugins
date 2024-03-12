const webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    Glob = require('glob'),
    Path = require('path'),
    privatePath = process.env.PLUGIN_PATH,
    isModern = process.env.MODE === 'modern',
    config = {
        devtool: 'nosources-source-map',
        performance: {
            maxEntrypointSize: 300000,
            maxAssetSize: 250000,
            hints: 'warning',
        },
        mode: 'production',
        optimization: {
            concatenateModules: true,
            removeAvailableModules: true,
            removeEmptyChunks: true,
            sideEffects: false,
            minimize: true,
            minimizer: [
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            "default",
                            {
                                zIndex: false,
                                discardComments: { removeAll: true }
                            },
                        ],
                    },
                    minify: [
                        CssMinimizerPlugin.cssnanoMinify,
                    ]
                }),
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true,
                        },
                        mangle: true,
                        ecma: isModern ? 8 : 5,
                        keep_classnames: false,
                        keep_fnames: false,
                        ie8: false,
                        module: false,
                        nameCache: null, // or specify a name cache object
                        safari10: !isModern,
                        toplevel: false,
                        warnings: false,
                    },
                    extractComments: false,
                }),
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"production"',
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
        stats: 'normal',
    };

module.exports = config;
