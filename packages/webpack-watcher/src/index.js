const fs = require('fs'),
    pathLib = require('path'),
    rimraf = require('rimraf'),
    chokidar = require('chokidar'),
    pluginPath = process.env.PLUGIN_PATH,
    vendorPath = process.env.VENDOR_PATH,
    publicPath = process.env.PUBLIC_PATH,
    glob = require('glob'),
    SCSS_FOLDER = 'scss',
    JS_FOLDER = 'js';

const watcher = {
    watch() {
        const fileList = glob.sync(pluginPath + '/index.js');

        const watcherInstance = chokidar.watch(fileList, {
            persistent: true,
        });

        watcherInstance
            .on('add', (path) => watcher.run(path))
            .on('unlink', (path) => watcher.run(path))
            .on('error', (error) => console.log(`Watcher error: ${error}`));

        return watcher;
    },

    run(path) {
        if (!path) {
            console.log('Rebuilding Index Files');
        }

        if (path) {
            console.log(`Adding ${path} to watchlist`);
        }

        watcher.compile(
            glob
                .sync(`${pluginPath}/${SCSS_FOLDER}`)
                .concat(
                    vendorPath ? glob.sync(`${vendorPath}/${SCSS_FOLDER}`) : [],
                ),
        );
        watcher.compile(
            glob
                .sync(`${pluginPath}/${JS_FOLDER}`)
                .concat(
                    vendorPath ? glob.sync(`${vendorPath}/${JS_FOLDER}`) : [],
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
        let files = fs
            .readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
            .filter((file) => file)
            .map(function(file) {
                var subpath = path + '/' + file;
                if (fs.lstatSync(subpath).isDirectory()) {
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

            let isJS = pathLib.extname(files[files.length - 1]) === '.js';
            let isSCSS = pathLib.extname(files[files.length - 1]) === '.scss';

            if (isJS) {
                name = `../index${pathLib.extname(files[files.length - 1])}`;

                let cssFiles = glob.sync(
                    `${filePath.replace(JS_FOLDER, SCSS_FOLDER)}/**/*.scss`,
                );

                files = cssFiles.length
                    ? ['./scss/index.scss'].concat(files)
                    : files;

                prefix = "import '";
                affix = "';\n";
            }

            if (isSCSS) {
                name = `index${pathLib.extname(files[files.length - 1])}`;
                prefix = '@import "';
                affix = '";\n';
            }

            if (!prefix && !affix) {
                console.error('filetype not supported', filePath);
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

            fs.writeFileSync(`${filePath}/${name}`, buffer);
        });
    },
};

module.exports = watcher;
