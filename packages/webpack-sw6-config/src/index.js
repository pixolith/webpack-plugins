const production = require('./webpack.config.production');
const storefront = require('./webpack.config.storefront');
const dev = require('./webpack.config.dev');
const administration = require('./webpack.config.administration');

module.exports = {
    production,
    storefront,
    dev,
    administration,
};
