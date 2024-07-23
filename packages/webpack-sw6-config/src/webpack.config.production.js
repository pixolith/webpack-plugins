const webpack = require('webpack'),
    TerserPlugin = require('terser-webpack-plugin'),
    CssMinimizerPlugin = require('css-minimizer-webpack-plugin'),
    StyleLintPlugin = require('stylelint-webpack-plugin'),
    Glob = require('glob'),
    Path = require('path'),
    privatePath = process.env.PLUGIN_PATH,
    config = {
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
