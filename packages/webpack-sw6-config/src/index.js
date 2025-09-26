const config = require('./config');
const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const dev = require('./webpack.config.dev');
const administration = require('./webpack.config.administration');
const pkg = require('./../package.json');
const watcher = require('@pixolith/webpack-watcher');
const { merge } = require('webpack-merge');

const setup = () => {
    watcher.clean(config);
    watcher.run(null, config);

    if (config.isDebug) {
        console.table({
            ...config,

            version: pkg.version,

            pluginMatch: config.pluginMatch.toString(),
            vendorMatch: config.vendorMatch.toString(),
            routeSplitMatch: config.routeSplitMatch.toString(),
            allowedExtensions: config.allowedExtensions.toString(),
            spriteOrder: config.spriteOrder.toString(),
            ignoreIcons: config.ignoreIcons.toString(),
        });
    } else {
        console.table({
            isProd: config.isProd,
            shopwareMode: config.shopwareMode,
            assetUrl: config.assetUrl,
            version: pkg.version,
        });
    }
};

setup();

module.exports = {
    storefront: merge(dev, storefront, config.isProd ? production : {}),
    administration: merge(dev, administration, config.isProd ? production : {}),
};
