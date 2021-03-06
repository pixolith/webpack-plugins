const webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    isModern = process.env.MODE === 'modern',
    config = {
        devtool: 'none',
        performance: {
            maxEntrypointSize: 300000,
            maxAssetSize: 250000,
            hints: 'warning',
        },
        mode: 'production',
        optimization: {
            concatenateModules: true,
            namedModules: false,
            removeAvailableModules: true,
            removeEmptyChunks: true,
            sideEffects: false,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        extractComments: false,
                        compress: {
                            drop_console: true,
                        },
                        mangle: true,
                        ecma: isModern ? 6 : 5, // specify one of: 5, 6, 7 or 8
                        keep_classnames: false,
                        keep_fnames: false,
                        ie8: false,
                        module: false,
                        nameCache: null, // or specify a name cache object
                        safari10: !isModern,
                        toplevel: false,
                        warnings: false,
                    },
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
