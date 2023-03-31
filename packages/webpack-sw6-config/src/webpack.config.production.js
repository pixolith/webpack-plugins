const webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
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
            minimizer: [
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            "default",
                            {
                                discardComments: { removeAll: true },
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
        ],
        stats: 'normal',
    };

module.exports = config;
