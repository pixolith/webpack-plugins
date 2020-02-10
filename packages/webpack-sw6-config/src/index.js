const dev = require('./webpack.config.dev');
const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const administration = require('./webpack.config.administration');
const isProd = process.env.NODE_ENV === 'production';
const merge = require('webpack-merge');

module.exports = {
    storefront: merge(dev, storefront, isProd ? production : {}),
    administration: merge(dev, administration, isProd ? production : {}),
};
