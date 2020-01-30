const Consola = require('consola');
const Dotenv = require('dotenv');
const sw6Config = require('@pixolith/webpack-sw6-config');
const isProd = process.env.NODE_ENV === 'production';
const merge = require('webpack-merge');

if (
    !(
        process.env.SHOPWARE_MODE === 'storefront' ||
        process.env.SHOPWARE_MODE === 'administration'
    )
) {
    Consola.error('SHOPWARE_MODE needs to be storefront or administration');
    process.exit(1);
}

Dotenv.config({
    path: `./.env.${process.env.SHOPWARE_MODE}`,
});

const shopwareConfig = sw6Config.process.env.SHOPWARE_MODE,
    devConfig = sw6Config.dev,
    productionConfig = sw6Config.production;

Consola.info(
    `Starting webpack in ${process.env.NODE_ENV} with ${process.env.SHOPWARE_MODE}`,
);

module.exports = [
    isProd
        ? merge(devConfig, shopwareConfig, productionConfig)
        : merge(devConfig, shopwareConfig),
];
