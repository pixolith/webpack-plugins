'use strict';

const Path = require('path');

const config = {
    isProd: process.env.NODE_ENV === 'production',
    isModern: process.env.MODE === 'modern',
    isDebug: !!process.env.DEBUG || false,
    shopwareMode: process.env.SHOPWARE_MODE,

    assetUrl: process.env.ASSET_URL || '/',
    pluginPrefixes: process.env.PLUGIN_PREFIXES,

    outputPath: Path.join(process.cwd(), process.env.OUTPUT_PATH),

    vendorBasePath: Path.join(process.cwd(), 'vendor'),
    pluginsBasePath: Path.join(process.cwd(), 'custom/plugins'),

    pluginsPublicPath: Path.join(process.cwd(), 'public'),
    vendorPublicPath: Path.join(process.cwd(), 'public/bundles'),

    shopwareVendorPath: Path.join(process.cwd(), 'vendor/shopware/storefront/Resources/app/storefront/vendor'),
    shopwarePluginPath: Path.join(process.cwd(), 'vendor/shopware/storefront/Resources/app/storefront/src'),

    spriteOutputPath: Path.join(process.cwd(), 'custom/plugins/PxswTheme/src/Resources/views'),
}

let prefixes = config.pluginPrefixes.split(',').map(p => `${p}*`).join('|');

const pluginSrcPath = Path.join(config.pluginsBasePath, `+(${prefixes})`);
const vendorSrcPath = Path.join(config.vendorBasePath, `+(${config.pluginPrefixes.replace(',', '|').toLowerCase()})`, '*');

const pluginMatch = new RegExp(`/plugins\/((${config.pluginPrefixes.replace(',', '|')})\\w*)\/`);
const vendorMatch = new RegExp(`/(vendor\/(${config.pluginPrefixes.replace(',', '|').toLowerCase()})\/[\\w-]*)\/`);

module.exports = {
    ...config,
    pluginSrcPath: Path.join(pluginSrcPath, process.env.PLUGIN_PATH),
    vendorSrcPath: Path.join(vendorSrcPath, process.env.PLUGIN_PATH),

    pluginMatch: pluginMatch,
    vendorMatch: vendorMatch,

    sharedScssPluginPath: Path.join(pluginSrcPath, process.env.PLUGIN_PATH, '../../shared'),
    sharedScssVendorPath: Path.join(vendorSrcPath, process.env.PLUGIN_PATH, '../../shared'),

    pluginResourcesPath: Path.join(pluginSrcPath, process.env.RESOURCES_PATH),
    vendorResourcesPath: Path.join(vendorSrcPath, process.env.RESOURCES_PATH)
}
