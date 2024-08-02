const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const dev = require('./webpack.config.dev');
const administration = require('./webpack.config.administration');
const isProd = process.env.NODE_ENV === 'production';
const pkg = require('./../package.json');
const watcher = require('@pixolith/webpack-watcher');
const { merge } = require('webpack-merge');
const Consola = require('consola');

const setup = () => {
    Consola.info('Cleaning output folder');
    watcher.clean();
    watcher.run();
    console.table({
        isProd: isProd,
        pluginPath: process.env.PLUGIN_PATH,
        vendorPath: process.env.VENDOR_PATH,
        publicPath: process.env.PUBLIC_PATH,
        sharedAssetPath: process.env.SHARED_SCSS_PATH,
        shopwareMode: process.env.SHOPWARE_MODE,
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
