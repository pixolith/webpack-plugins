const Fs = require('fs'),
    Path = require('path'),
    rimraf = require('rimraf'),
    Chokidar = require('chokidar'),
    Consola = require('consola'),
    Glob = require('glob'),
    ChangeCase = require('change-case');

let rampUpDone = false

const watcher = {
    watch(config) {
        const fileList = [].concat(
            Glob.sync(config.pluginSrcPath),
            Glob.sync(config.sharedScssPluginPath),
            Glob.sync(config.vendorSrcPath),
            Glob.sync(config.sharedScssVendorPath),
        );

        const watcherInstance = Chokidar.watch(fileList, {
            persistent: true,
        });

        watcherInstance
            .on('add', (path) => watcher.run(path, config, 'add'))
            .on('unlink', (path) => watcher.run(path, config, 'unlink'))
            .on('error', (error) => Consola.error(`Watcher error: ${error}`))
            .on('ready', () => watcher.run(null, config, 'ready'));

        console.table(watcherInstance.getWatched());

        return watcher;
    },

    run(path, config, event) {
        if (!path) {
            Consola.info('Rebuilding Index Files');
        }
        if (event === 'ready') {
            rampUpDone = true;
        }
        if (!rampUpDone && path) {
            return;
        }
        if (path) {
            Consola.info(`Adding ${path} to watchlist`);
        }

        if (config.isDebug) {
            Consola.info('=== SCSS FILES ===');
            Consola.info('found paths for sharedScssPluginPath');
            console.table(config.sharedScssPluginPath ? Glob.sync(config.sharedScssPluginPath) : []);

            Consola.info('found paths for pluginScssPath');
            console.table(config.pluginScssPath ? Glob.sync(config.pluginScssPath) : []);

            Consola.info('found paths for pluginRouteSplitPath');
            console.table(config.pluginRouteSplitPath ? Glob.sync(config.pluginRouteSplitPath) : []);

            Consola.info('found paths for sharedScssVendorPath');
            console.table(config.sharedScssVendorPath ? Glob.sync(config.sharedScssVendorPath) : []);

            Consola.info('found paths for vendorScssPath');
            console.table(config.vendorScssPath ? Glob.sync(config.vendorScssPath) : []);

            Consola.info('found paths for vendorRouteSplitPath');
            console.table(config.vendorRouteSplitPath ? Glob.sync(config.vendorRouteSplitPath) : []);

            Consola.info('=== JS FILES ===');
            Consola.info('found paths for pluginJsPath');
            console.table(config.pluginJsPath ? Glob.sync(config.pluginJsPath) : []);

            Consola.info('found paths for vendorJsPath');
            console.table(config.vendorJsPath ? Glob.sync(config.vendorJsPath) : []);
        }

        watcher.compile(
            [].concat(
                config.sharedScssPluginPath ? Glob.sync(config.sharedScssPluginPath) : [],
                config.pluginScssPath ? Glob.sync(config.pluginScssPath) : [],
                config.shopwareMode === 'storefront' && config.pluginRouteSplitPath ? Glob.sync(config.pluginRouteSplitPath) : [],

                config.sharedScssVendorPath ? Glob.sync(config.sharedScssVendorPath) : [],
                config.vendorScssPath ? Glob.sync(config.vendorScssPath) : [],
                config.shopwareMode === 'storefront' && config.vendorRouteSplitPath ? Glob.sync(config.vendorRouteSplitPath) : [],
            ),
            'scss',
            config
        );

        watcher.compile(
            [].concat(
                config.pluginJsPath ? Glob.sync(config.pluginJsPath) : [],
                config.vendorJsPath ? Glob.sync(config.vendorJsPath) : [],
            ),
            'js',
            config
        );
    },

    clean(config) {
        Consola.info('Cleaning output folder');
        rimraf.sync(`${config.outputPath}/**/*.hot-update.*`, { glob: true });
    },

    compare(a, b) {
        return a === b;
    },

    walkTheLine(path) {
        let files = Fs.readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
            .filter((file) => !file.startsWith('async'))
            .filter((file) => file)
            .map((file) => {
                const subPath = path + '/' + file;
                if (Fs.lstatSync(subPath).isDirectory()) {
                    return watcher.walkTheLine(subPath);
                } else {
                    return subPath;
                }
            });

        return [].concat.apply([], files);
    },

    compile(filePaths = [], type, config) {
        filePaths.forEach((filePath) => {
            let buffer = '';
            let name = '../index.js';
            let prefix = "import '";
            let affix = "';\n";

            if (type === 'scss') {
                name = `${watcher.generateName(filePath, config)}index.scss`;
                prefix = "@import '";
                affix = "';\n";
            }

            let files = watcher.walkTheLine(filePath).sort((a, b) => {
                // sort index.js files by path length
                if (
                    a.indexOf('index.js') !== -1 &&
                    b.indexOf('index.js') !== -1
                ) {
                    if (a.split('/').length !== b.split('/').length) {
                        return b.split('/').length - a.split('/').length;
                    }

                    return a.localeCompare(b);
                }

                // index.js at the end
                if (a.indexOf('index.js') !== -1) {
                    return 1;
                }

                // index.js at the end
                if (b.indexOf('index.js') !== -1) {
                    return -1;
                }

                // rest alphabetically
                return a.localeCompare(b);
            }).filter((file) => {
                return (
                    file &&
                    !file.includes(name) &&
                    config.allowedExtensions.includes(Path.extname(file))
                );
            });

            if (!files.length) {
                return;
            }

            if (type === 'js') {
                // start: compatibility for shared and scss folders
                let scssEntry = Glob.sync(
                    `${filePath.replace(config.jsFolder, config.scssFolder)}/*index.scss`,
                );

                files = scssEntry.length
                    ? [`./${config.scssFolder}/${scssEntry[0].split('/').pop()}`].concat(files)
                    : files;

                let sharedScssEntry = Glob.sync(Path.resolve(
                    filePath,
                    `../${config.pxSharedPath}/${config.scssFolder}/*index.scss`,
                ));

                files = sharedScssEntry.length
                    ? [`./${config.pxSharedPath}/${config.scssFolder}/${sharedScssEntry[0].split('/').pop()}`].concat(files)
                    : files;
                // end: compatibility for shared and scss folders

                // include icons only in storefront
                if (config.shopwareMode === 'storefront' &&
                    Fs.existsSync(
                        Path.resolve(
                            filePath,
                            `../${config.pxSharedPath}/${config.iconsFolder}`,
                        ),
                    )
                ) {
                    files = files.concat(
                        Glob.sync(
                            Path.resolve(
                                filePath,
                                `../${config.pxSharedPath}/${config.iconsFolder}/*.svg`,
                            ),
                        ).map(
                            (path) =>
                                `./${config.pxSharedPath}/${config.iconsFolder}/${Path.basename(
                                    path,
                                )}`,
                        ),
                    );
                }
            }

            // start: compatibility for old scss folders with auto include to index.js
            if (type === 'scss' && !filePath.includes('shared') && !filePath.includes('scss-route-split')) {
                let includeContent = `import './scss/${name}';\n`;
                includeContent +=
                    'if (module.hot) {\n' +
                    '    module.hot.accept();\n' +
                    '}\n';

                Fs.writeFileSync(`${filePath}/../index.js`, includeContent);
            }
            // end: compatibility for old scss folders with auto include to index.js

            files.forEach((file) => {
                buffer +=
                    prefix +
                    file.replace(filePath, type === 'js' ? `./${config.jsFolder}` : '.') +
                    affix;
            });

            if (type === 'js') {
                buffer +=
                    'if (module.hot) {\n' +
                    '    module.hot.accept();\n' +
                    '}\n';
            }

            if (type !== 'js' && type !== 'scss') {
                Consola.error(
                    'This basically means there are a bunch of resources but no direct include so we wont do anything',
                );
                Consola.error(
                    'For instance shared should not be directly included',
                );
                Consola.error('If you ever get here call 911');
                return;
            }

            Fs.writeFileSync(`${filePath}/${name}`, buffer);
        });
    },

    generateName(filePath, config) {
        let name = '';
        let match = filePath.match(config.routeSplitMatch);
        if (match) {
            name = `_${match[1]}`;
        }

        match = filePath.match(config.pluginMatch);
        if (match) {
            return ChangeCase.kebabCase(match[1]) + name + '.';
        }

        match = filePath.match(config.vendorMatch);
        if (match) {
            return ChangeCase.kebabCase(match[1]) + name + '.';
        }

        return name;
    }
};

module.exports = watcher;
