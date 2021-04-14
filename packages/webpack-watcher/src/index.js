const Fs = require('fs'),
    Path = require('path'),
    rimraf = require('rimraf'),
    Chokidar = require('chokidar'),
    Consola = require('consola'),
    Glob = require('glob'),
    SCSS_FOLDER = process.env.SCSS_FOLDER || 'scss',
    JS_FOLDER = process.env.JS_FOLDER || 'js',
    ICONS_FOLDER = process.env.ICONS_FOLDER || 'icons',
    allowedExtensions = ['.js', '.scss', '.css', '.svg'];

const watcher = {
    watch(config) {
        const fileList = [].concat(
            Glob.sync(config.pluginSrcPath),
            config.sharedScssPluginPath
                ? Glob.sync(config.sharedScssPluginPath)
                : [],
        );

        const watcherInstance = Chokidar.watch(fileList, {
            persistent: true,
        });

        watcherInstance
            .on('add', (path) => () => watcher.run(path, config))
            .on('unlink', (path) => () => watcher.run(path, config))
            .on('error', (error) => Consola.error(`Watcher error: ${error}`));

        return watcher;
    },

    run(path, config) {
        console.log('called');
        if (!path) {
            Consola.info('Rebuilding Index Files');
        }

        if (config.isDebug) {
            if (path) {
                Consola.info(`Adding ${path} to watchlist`);
            }

            Consola.info('Shared plugin scss paths');
            Consola.info(
                config.sharedScssPluginPath
                    ? Glob.sync(`${config.sharedScssPluginPath}/${SCSS_FOLDER}`)
                    : [],
            );

            Consola.info('Plugin scss paths');
            Consola.info(
                config.sharedScssPluginPath
                    ? Glob.sync(`${config.sharedScssPluginPath}/${SCSS_FOLDER}`)
                    : [],
            );

            Consola.info('Shared vendor scss paths');
            Consola.info(
                config.sharedScssVendorPath
                    ? Glob.sync(`${config.sharedScssVendorPath}/${SCSS_FOLDER}`)
                    : [],
            );

            Consola.info('Vendor scss paths');
            Consola.info(
                config.vendorSrcPath
                    ? Glob.sync(`${config.vendorSrcPath}/${SCSS_FOLDER}`)
                    : [],
            );

            Consola.info('Plugin js paths');
            Consola.info(
                config.pluginSrcPath
                    ? Glob.sync(`${config.pluginSrcPath}/${JS_FOLDER}`)
                    : [],
            );

            Consola.info('Vendor js paths');
            Consola.info(
                config.vendorSrcPath
                    ? Glob.sync(`${config.vendorSrcPath}/${JS_FOLDER}`)
                    : [],
            );
        }

        watcher.compile(
            [].concat(
                config.sharedScssPluginPath
                    ? Glob.sync(`${config.sharedScssPluginPath}/${SCSS_FOLDER}`)
                    : [],
                config.pluginSrcPath
                    ? Glob.sync(`${config.pluginSrcPath}/${SCSS_FOLDER}`)
                    : [],
                config.sharedScssVendorPath
                    ? Glob.sync(`${config.sharedScssVendorPath}/${SCSS_FOLDER}`)
                    : [],
                config.vendorSrcPath
                    ? Glob.sync(`${config.vendorSrcPath}/${SCSS_FOLDER}`)
                    : [],
            ),
            'scss',
        );

        watcher.compile(
            [].concat(
                config.pluginSrcPath
                    ? Glob.sync(`${config.pluginSrcPath}/${JS_FOLDER}`)
                    : [],
                config.vendorSrcPath
                    ? Glob.sync(`${config.vendorSrcPath}/${JS_FOLDER}`)
                    : [],
            ),
            'js',
        );
    },

    clean(config) {
        rimraf.sync(`${config.outputPath}/**/*.hot-update.*`);
    },

    compare(a, b) {
        return a === b;
    },

    walkTheLine(path) {
        let files = Fs.readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
            .filter((file) => file)
            .map((file) => {
                var subpath = path + '/' + file;
                if (Fs.lstatSync(subpath).isDirectory()) {
                    return watcher.walkTheLine(subpath);
                } else {
                    return path + '/' + file;
                }
            });

        return [].concat.apply([], files);
    },

    compile(filePaths = [], type) {
        console.log(filePaths);
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
                console.log(filePath);
                return;
            }

            if (type === 'js') {
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
                        type !== 'scss' &&
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

            if (type === 'scss') {
                name = 'index.scss';
                prefix = "@import '";
                affix = "';\n";

                let includeContent = "import './scss/index.scss';\n";
                includeContent +=
                    'if (module.hot) {\n' +
                    '    module.hot.accept();\n' +
                    '}\n';

                Fs.writeFileSync(`${filePath}/../index.js`, includeContent);
            }

            files
                .filter((file) => {
                    return (
                        file &&
                        !file.includes(name) &&
                        allowedExtensions.includes(Path.extname(file))
                    );
                })
                .forEach((file) => {
                    buffer +=
                        prefix +
                        file.replace(
                            filePath,
                            type === 'js' ? `./${JS_FOLDER}` : '.',
                        ) +
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
