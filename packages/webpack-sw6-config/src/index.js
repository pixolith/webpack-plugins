import config from './config.js';
import production from './webpack.config.production.js';
import storefront from './webpack.config.storefront.js';
import dev from './webpack.config.dev.js';
import administration from './webpack.config.administration.js';
import pkg from './../package.json' assert { type: 'json' };
import watcher from '@pixolith/webpack-watcher';
import {merge} from 'webpack-merge';

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

export const storefrontConfig = merge(dev, storefront, config.isProd ? production : {});
export const administrationConfig = merge(dev, administration, config.isProd ? production : {});
