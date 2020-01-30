const Fs = require('fs'),
    Path = require('path'),
    rimraf = require('rimraf'),
    Chokidar = require('chokidar'),
    Consola = require('consola'),
    pluginPath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    publicPath = process.env.PUBLIC_PATH,
    sharedPath = Path.resolve(pluginPath, process.env.SHARED_SCSS_PATH),
    sharedVendorPath = Path.resolve(vendorPath, process.env.SHARED_SCSS_PATH),
    Glob = require('glob'),
    SCSS_FOLDER = 'scss',
    JS_FOLDER = 'js';

const watcher = {
    watch() {
        const fileList = Glob.sync(pluginPath + '/index.js');

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

        if (path) {
            Consola.info(`Adding ${path} to watchlist`);
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
        rimraf.sync(`${publicPath}/**/*.js`);
        rimraf.sync(`${publicPath}/**/*.css`);
    },

    compare(a, b) {
        return a === b;
    },

    walkTheLine(path) {
        let files = Fs.readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
            .filter((file) => file)
            .map(function(file) {
                var subpath = path + '/' + file;
                if (Fs.lstatSync(subpath).isDirectory()) {
                    return watcher.walkTheLine(subpath);
                } else {
                    return path + '/' + file;
                }
            });

        return [].concat.apply([], files);
    },

    compile(filePaths = []) {
        filePaths.forEach((filePath) => {
            let files = watcher.walkTheLine(filePath).sort((a, b) => {
                // sort the path lengh
                if (a.split('/').length - 1 !== b.split('/').length - 1) {
                    return a.split('/').length - 1 < b.split('/').length - 1;
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

            let isJS = Path.extname(files[files.length - 1]) === '.js';
            let isSCSS = Path.extname(files[files.length - 1]) === '.scss';

            if (isJS) {
                if (!filePath.includes('/shared/')) {
                    if (
                        Fs.existsSync(
                            Path.resolve(
                                filePath,
                                `../../../shared/${SCSS_FOLDER}`,
                            ),
                        )
                    ) {
                        files = ['./../../shared/scss/index.scss'].concat(
                            files,
                        );
                    }
                }
                name = `../index${Path.extname(files[files.length - 1])}`;

                let cssFiles = Glob.sync(
                    `${filePath.replace(JS_FOLDER, SCSS_FOLDER)}/**/*.scss`,
                );

                files = cssFiles.length
                    ? ['./scss/index.scss'].concat(files)
                    : files;

                prefix = "import '";
                affix = "';\n";
            }

            if (isSCSS) {
                name = `index${Path.extname(files[files.length - 1])}`;
                prefix = '@import "';
                affix = '";\n';
            }

            if (!prefix && !affix) {
                Consola.error('filetype not supported', filePath);
            }

            files
                .filter((file) => !file.includes(name))
                .forEach((file) => {
                    buffer +=
                        prefix +
                        file.replace(filePath, isJS ? './js' : '.') +
                        affix;
                });

            if (isJS) {
                buffer +=
                    'if (module.hot) {\n' +
                    '    module.hot.accept();\n' +
                    '}\n';
            }

            Fs.writeFileSync(`${filePath}/${name}`, buffer);
        });
    },
};

module.exports = watcher;