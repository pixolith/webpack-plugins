const production = require('./webpack.config.production');
const dev = require('./webpack.config.dev');
const merge = require('webpack-merge');
const isProd = process.env.NODE_ENV === 'production';
const pkg = require('./../package.json');
const Consola = require('Consola');
const isModern = process.env.MODE === 'modern';
const watcher = require('@pixolith/webpack-watcher');

let setup = () => {
    Consola.info('Cleaning output folder');
    watcher.clean();
    Consola.info('Building index files');
    watcher.run();
    console.table({
        isProd: isProd,
        isModern: isModern,
        pluginPath: process.env.PLUGIN_PATH,
        publicPath: process.env.PUBLIC_PATH,
        jsTranspile: process.env.JS_TRANSPILE,
        globalResourcesPaths: process.env.RESOURCES_PATHS,
        version: pkg.version,
    });
};

setup();

module.exports = [isProd ? merge(dev, production) : merge(dev)];
