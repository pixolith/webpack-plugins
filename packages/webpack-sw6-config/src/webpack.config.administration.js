const config = require('./config');

const Path = require('path'),
    Fs = require('fs'),
    Entry = require('webpack-glob-entry'),
    ChangeCase = require('change-case'),
    MiniCssExtractPlugin = require('mini-css-extract-plugin'),
    Consola = require('consola');

module.exports = function createAdministrationConfig(themeOptions) {
    let themeName = themeOptions && themeOptions.themeName;
    let themeSlug = themeName
        ? ChangeCase.kebabCase(themeName)
        : 'administration';

    let outputConfig = {
        path: config.outputPath,
        publicPath: config.assetUrl,
        filename: (chunkData) => {
            return `js/${chunkData.chunk.name.toLowerCase()}${
                config.isProd ? '.admin.[contenthash]' : ''
            }.js`;
        },
        uniqueName: themeSlug + '-admin',
    };

    let miniCssChunksConfig = {
        filename: (chunkData) => {
            return `css/[name]${
                config.isProd ? '.admin.[contenthash]' : ''
            }.css`;
        },
    };

    return {
        name: themeSlug + '-admin',
        entry: () => {
            let entriesPlugins = Entry(
                (filePath) =>
                    ChangeCase.kebabCase(filePath.match(config.pluginMatch)[2]),
                Path.join(config.pluginSrcPath, 'index.js'),
            );

            let entriesVendor = Entry(
                (filePath) =>
                    ChangeCase.kebabCase(filePath.match(config.vendorMatch)[1]),
                Path.resolve(config.vendorSrcPath, 'index.js'),
            );

            // Discover the consolidated admin SCSS entry from .theme-entries/{theme-slug}/
            let scssEntries = {};
            let scssEntryDir = Path.join(
                config.outputPath,
                '.theme-entries',
                themeSlug,
            );
            let scssEntryFile = Path.join(
                scssEntryDir,
                themeSlug + '-admin.scss',
            );

            if (Fs.existsSync(scssEntryFile)) {
                scssEntries[themeSlug + '-admin-scss'] = scssEntryFile;
            }

            let allEntries = {
                ...entriesPlugins,
                ...entriesVendor,
                ...scssEntries,
            };

            if (config.isDebug) {
                Consola.info(
                    `[${themeName || themeSlug}] Administration webpack entry points:`,
                );
                console.table(allEntries);
            }

            return allEntries;
        },
        module: {
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
                    test: /\.(jpe?g|png|gif|ico)(\?v=\d+\.\d+\.\d+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'img/[name][ext]',
                    },
                },
                {
                    test: /\.(eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext]',
                    },
                },
            ],
        },
        output: outputConfig,
        plugins: [new MiniCssExtractPlugin(miniCssChunksConfig)],

        optimization: {
            splitChunks: false,
        },
    };
};
