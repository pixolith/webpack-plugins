const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const dev = require('./webpack.config.dev');
const administration = require('./webpack.config.administration');
const pkg = require('./../package.json');
const watcher = require('@pixolith/webpack-watcher');
const merge = require('webpack-merge');
const Consola = require('consola');
const config = require('./config');

const setup = () => {
    Consola.info('Cleaning output folder');
    watcher.clean(config);
    Consola.info('Building index files');
    watcher.run(null, config);
    console.table({
        ...config,
        version: pkg.version,

        pluginMatch: config.pluginMatch.toString(),
        vendorMatch: config.vendorMatch.toString(),
    });
};

setup();

module.exports = {
    storefront: merge(dev, storefront, config.isProd ? production : {}),
    administration: merge(dev, administration, config.isProd ? production : {}),
};
