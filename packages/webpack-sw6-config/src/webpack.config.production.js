const webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
    RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts'),
    productionConfig = {
        devtool: 'nosources-source-map',
        performance: {
            maxEntrypointSize: 300000,
            maxAssetSize: 250000,
            hints: 'warning',
        },
        mode: 'production',
        optimization: {
            splitChunks: false,
            runtimeChunk: false,
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
                    minify: TerserPlugin.swcMinify,
                    terserOptions: {
                        compress: {
                            drop_console: true,
                        },
                    },
                    parallel: true,
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
            new RemoveEmptyScriptsPlugin(),
        ],
        stats: 'normal',
    };

module.exports = productionConfig;
