const production = require('./webpack.config.production');
const dev = require('./webpack.config.dev');
const merge = require('webpack-merge');
const isProd = process.env.NODE_ENV === 'production';

module.exports = [isProd ? merge(dev, production) : merge(dev)];
