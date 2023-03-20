const Fs = require('fs'),
    Path = require('path'),
    rimraf = require('rimraf'),
    Chokidar = require('chokidar'),
    Consola = require('consola'),
    pluginPath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    publicPath = process.env.PUBLIC_PATH,
    sharedPath =
        pluginPath && process.env.SHARED_SCSS_PATH
            ? Path.resolve(pluginPath, process.env.SHARED_SCSS_PATH)
            : null,
    sharedVendorPath =
        vendorPath && process.env.SHARED_SCSS_PATH
            ? Path.resolve(vendorPath, process.env.SHARED_SCSS_PATH)
            : null,
    Glob = require('glob'),
    SCSS_FOLDER = process.env.SCSS_FOLDER || 'scss',
    JS_FOLDER = process.env.JS_FOLDER || 'js',
    ICONS_FOLDER = process.env.ICONS_FOLDER || 'icons',
    allowedExtensions = ['.js', '.scss', '.css', '.svg'];

const watcher = {
    watch() {
        const fileList = [].concat(
            Glob.sync(pluginPath),
            sharedPath ? Glob.sync(sharedPath) : [],
        );

        const watcherInstance = Chokidar.watch(fileList, {
            persistent: true,
        });

        watcherInstance
            .on('add', (path) => watcher.run(path))
            .on('unlink', (path) => watcher.run(path))
            .on('error', (error) => Consola.error(`Watcher error: ${error}`));

        return watcher;
    },

    run(path) {
        if (!path) {
            Consola.info('Rebuilding Index Files');
        }

        if (process.env.DEBUG) {
            if (path) {
                Consola.info(`Adding ${path} to watchlist`);
            }

            Consola.info('Shared plugin scss paths');
            Consola.info(
                sharedPath ? Glob.sync(`${sharedPath}/${SCSS_FOLDER}`) : [],
            );

            Consola.info('Plugin scss paths');
            Consola.info(
                pluginPath ? Glob.sync(`${pluginPath}/${SCSS_FOLDER}`) : [],
            );

            Consola.info('Shared vendor scss paths');
            Consola.info(
                sharedVendorPath
                    ? Glob.sync(`${sharedVendorPath}/${SCSS_FOLDER}`)
                    : [],
            );

            Consola.info('Vendor scss paths');
            Consola.info(
                vendorPath ? Glob.sync(`${vendorPath}/${SCSS_FOLDER}`) : [],
            );

            Consola.info('Plugin js paths');
            Consola.info(
                pluginPath ? Glob.sync(`${pluginPath}/${JS_FOLDER}`) : [],
            );

            Consola.info('Vendor js paths');
            Consola.info(
                vendorPath ? Glob.sync(`${vendorPath}/${JS_FOLDER}`) : [],
            );
        }

        watcher.compile(
            [].concat(
                sharedPath ? Glob.sync(`${sharedPath}/${SCSS_FOLDER}`) : [],
                pluginPath ? Glob.sync(`${pluginPath}/${SCSS_FOLDER}`) : [],
                sharedVendorPath
                    ? Glob.sync(`${sharedVendorPath}/${SCSS_FOLDER}`)
                    : [],
                vendorPath ? Glob.sync(`${vendorPath}/${SCSS_FOLDER}`) : [],
            ),
        );
        watcher.compile(
            [].concat(
                pluginPath ? Glob.sync(`${pluginPath}/${JS_FOLDER}`) : [],
                vendorPath ? Glob.sync(`${vendorPath}/${JS_FOLDER}`) : [],
            ),
        );
    },

    clean() {
        rimraf.sync(`${publicPath}/**/*.hot-update.*`);
    },

    compare(a, b) {
        return a === b;
    },

    walkTheLine(path) {
        let files = Fs.readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
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

    compile(filePaths = []) {
        filePaths.forEach((filePath) => {
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
                    return true;
                }

                // index.js at the end
                if (b.indexOf('index.js') !== -1) {
                    return false;
                }

                // rest alphabetically
                return a.localeCompare(b);
            });

            let buffer = '';
            let name;
            let prefix;
            let affix;

            if (!files.length) {
                return;
            }

            let isJS = files[files.length - 1]
                .split('/')
                .filter((path) => path.toLowerCase() === 'js').length;
            let isSCSS = files[files.length - 1]
                .split('/')
                .filter((path) => path.toLowerCase() === 'scss').length;

            if (isJS) {
                name = '../index.js';

                let cssFiles = Glob.sync(
                    `${filePath.replace(JS_FOLDER, SCSS_FOLDER)}/**/*.scss`,
                );

                files = cssFiles.length
                    ? [`./${SCSS_FOLDER}/index.scss`].concat(files)
                    : files;

                if (!filePath.includes('/shared/')) {
                    if (
                        Fs.existsSync(
                            Path.resolve(
                                filePath,
                                `../../../shared/${SCSS_FOLDER}`,
                            ),
                        )
                    ) {
                        files = [
                            `./../../shared/${SCSS_FOLDER}/index.scss`,
                        ].concat(files);
                    }

                    if (
                        Fs.existsSync(
                            Path.resolve(
                                filePath,
                                `../../../shared/${ICONS_FOLDER}`,
                            ),
                        )
                    ) {
                        files = files.concat(
                            Glob.sync(
                                Path.resolve(
                                    filePath,
                                    `../../../shared/${ICONS_FOLDER}/*.svg`,
                                ),
                            ).map(
                                (path) =>
                                    `./../../shared/${ICONS_FOLDER}/${Path.basename(
                                        path,
                                    )}`,
                            ),
                        );
                    }
                }

                prefix = "import '";
                affix = "';\n";
            }

            if (isSCSS) {
                name = 'index.scss';
                prefix = "@import '";
                affix = "';\n";
            }

            files
                .filter((file) => {
                    return (
                        file &&
                        !file.includes(name) &&
                        !file.includes('placeholder.js') &&
                        allowedExtensions.includes(Path.extname(file))
                    );
                })
                .forEach((file) => {
                    buffer +=
                        prefix +
                        file.replace(filePath, isJS ? `./${JS_FOLDER}` : '.') +
                        affix;
                });

            if (
                files.filter((file) => {
                    return (
                        file &&
                        !file.includes(name) &&
                        !file.includes('placeholder.js') &&
                        ['.js'].includes(Path.extname(file))
                    );
                }).length
            ) {
                buffer +=
                    'if (module.hot) {\n' +
                    '    module.hot.accept();\n' +
                    '}\n';
            }

            if (!isJS && !isSCSS) {
                Consola.error(
                    'This basically means there are a bunch of ressources but no direct include so we wont do anything',
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
};

module.exports = watcher;
