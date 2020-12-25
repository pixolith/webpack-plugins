const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const dev = require('./webpack.config.dev');
const administration = require('./webpack.config.administration');
const isProd = process.env.NODE_ENV === 'production';
const pkg = require('./../package.json');
const isModern = process.env.MODE === 'modern';
const watcher = require('@pixolith/webpack-watcher');
const merge = require('webpack-merge');
const Consola = require('consola');

const setup = () => {
    Consola.info('Cleaning output folder');
    watcher.clean();
    Consola.info('Building index files');
    watcher.run();
    console.table({
        isProd: isProd,
        isModern: isModern,
        pluginPath: process.env.PLUGIN_PATH,
        vendorPath: process.env.VENDOR_PATH,
        publicPath: process.env.PUBLIC_PATH,
        sharedAssetPath: process.env.SHARED_SCSS_PATH,
        shopwareMode: process.env.SHOPWARE_MODE,
        jsTranspile: process.env.JS_TRANSPILE,
        globalResourcesPaths: process.env.RESOURCES_PATHS,
        debug: process.env.DEBUG || false,
        version: pkg.version,
        assetUrl: process.env.ASSET_URL || '/',
    });
};

setup();

module.exports = {
    storefront: merge(dev, storefront, isProd ? production : {}),
    administration: merge(dev, administration, isProd ? production : {}),
};
