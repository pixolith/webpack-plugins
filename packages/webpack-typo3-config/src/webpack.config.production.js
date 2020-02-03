const merge = require('webpack-merge'),
    webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    config = {
        devtool: '#cheap-module-source-map',
        performance: {
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
                        compress: {
                            drop_console: true,
                        },
                        mangle: true,
                        ecma: 5, // specify one of: 5, 6, 7 or 8
                        keep_classnames: false,
                        keep_fnames: false,
                        ie8: false,
                        module: false,
                        nameCache: null, // or specify a name cache object
                        safari10: false,
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
    };

module.exports = config;
