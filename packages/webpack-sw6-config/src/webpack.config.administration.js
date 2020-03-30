const Path = require('path'),
    privatePath = process.env.PLUGIN_PATH,
    changeCase = require('change-case'),
    entry = require('webpack-glob-entry'),
    publicPath = process.env.PUBLIC_PATH,
    ExtractCssChunks = require('extract-css-chunks-webpack-plugin'),
    AssetsCopyPlugin = require('@pixolith/webpack-assets-copy-plugin'),
    isProd = process.env.NODE_ENV === 'production',
    SvgStorePlugin = require('external-svg-sprite-loader'),
    CopyPlugin = require('copy-webpack-plugin'),
    //isModern = process.env.MODE === 'modern',
    outputConfig = {
        path: Path.resolve(process.cwd(), publicPath),
        publicPath: '/',
        filename: (chunkData) => {
            let pluginName = chunkData.chunk.name
                .toLowerCase()
                .replace('vendor-', '');
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/js/${pluginName}.js`;
        },
    },
    extractCssChunksConfig = {
        moduleFilename: ({ name }) => {
            let pluginName = name.replace('vendor-', '').toLowerCase();
            return `${pluginName.replace(
                /-/g,
                '',
            )}/administration/css/${pluginName}.css`;
        },
        hot: !isProd,
    };

module.exports = {
    entry: () => {
        let entriesPlugins = entry(
            (filePath) =>
                changeCase.paramCase(
                    filePath.match(/plugins\/(Pxsw[\w]*)\//)[1],
                ),
            Path.resolve(privatePath, 'index.js'),
        );

        return { ...entriesPlugins };
    },
    performance: {
        maxEntrypointSize: 300000,
        hints: false,
    },
    resolve: {
        modules: [
            'node_modules',
            Path.resolve(privatePath, 'js'),
            Path.resolve(
                process.cwd(),
                'www/vendor/shopware/storefront/Resources/app/storefront/vendor',
            ),
        ],
        alias: {
            src: Path.join(
                process.cwd(),
                'www/vendor/shopware/storefront/Resources/app/storefront/src',
            ),
        },
    },
    module: {
        // loader order is from right to left or from bottom to top depending on the notation but basicly always reverse
        rules: [
            {
                test: /\.js$/,
                exclude: (file) => /node_modules/.test(file),
                loader: 'babel-loader',
                options: {
                    configFile: Path.resolve(__dirname, 'babel.config.js'),
                },
            },
            {
                test: /\.png|\.jpg$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 100000,
                            outputPath: '../images',
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
                            outputPath: '../fonts',
                        },
                    },
                ],
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: SvgStorePlugin.loader,
                        options: {
                            name: 'sprite/sprite.svg',
                            iconName: '[name]',
                        },
                    },
                    {
                        loader: 'svgo-loader',
                        options: {
                            plugins: [
                                // don't enable this
                                { removeViewBox: false },
                                //
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
        ],
    },
    output: outputConfig,
    plugins: [
        new AssetsCopyPlugin({
            includes: ['js', 'css'],
            ignoreFiles: [/[-\w.]*.hot-update.js/, /sprite\/sprite.svg/],
            files: [
                {
                    from: publicPath,
                    to: 'www/custom/plugins/$plugin/src/Resources/public',
                    replace: (fromPath, toPath) => {
                        let pluginName = changeCase.pascalCase(
                            Path.basename(fromPath).replace(
                                Path.extname(fromPath),
                                '',
                            ),
                        );

                        toPath = toPath.replace('$plugin', pluginName);
                        return toPath;
                    },
                },
            ],
        }),

        new SvgStorePlugin({
            sprite: {
                startX: 10,
                startY: 10,
                deltaX: 20,
                deltaY: 20,
                iconHeight: 48,
            },
        }),

        new CopyPlugin([
            {
                from: Path.join(process.cwd(), 'www/public/sprite/sprite.svg'),
                to: Path.join(
                    process.cwd(),
                    'www/custom/plugins/PxswTheme/src/Resources/views/administration/_sprite.svg',
                ),
            },
        ]),

        new ExtractCssChunks(extractCssChunksConfig),
    ],

    optimization: {
        splitChunks: false,
    },
};
