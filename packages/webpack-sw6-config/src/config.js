'use strict';

import Path from 'path';

const config = {
    isProd: process.env.NODE_ENV === 'production',
    isDebug: !!process.env.DEBUG || false,
    shopwareMode: process.env.SHOPWARE_MODE,

    assetUrl: process.env.ASSET_URL || '/',
    pluginPrefixes: process.env.PLUGIN_PREFIXES || 'Pxsw',

    pxSharedPath: process.env.SHARED_SCSS_PATH || '../../shared',
    scssFolder: process.env.SCSS_FOLDER || 'scss',
    jsFolder: process.env.JS_FOLDER || 'js',
    iconsFolder: process.env.ICONS_FOLDER || 'icons',

    spriteOrder: process.env.SPRITE_ORDER ?? ['pxsw/basic-theme', 'PxswBasicTheme', '**', 'pxsw/customer-theme', 'PxswCustomerTheme'],
    ignoreIcons: process.env.IGNORE_ICONS ?? [],

    mediaQueries: process.env.MEDIA_QUERIES || false,

    outputPath: Path.join(process.cwd(), process.env.PUBLIC_PATH ?? ''),

    vendorBasePath: Path.join(process.cwd(), 'vendor'),
    pluginsBasePath: Path.join(process.cwd(), 'custom/plugins'),

    pluginsPublicPath: Path.join(process.cwd(), 'public'),
    vendorPublicPath: Path.join(process.cwd(), 'public/bundles'),

    shopwareVendorPath: Path.join(process.cwd(), 'vendor/shopware/storefront/Resources/app/storefront/vendor'),
    shopwarePluginPath: Path.join(process.cwd(), 'vendor/shopware/storefront/Resources/app/storefront/src'),

    spriteOutputPath: Path.join(process.cwd(), 'custom/plugins/PxswTheme/src/Resources/views'),

    allowedExtensions: ['.ts', '.js', '.scss', '.css', '.svg']
}

const pxEntryPath = process.env.PX_ENTRY_PATH || process.env.SHOPWARE_MODE === 'storefront' ? 'src/Resources/app/storefront/private' : 'src/Resources/app/administration/src';
const pxRouteSplitPath = process.env.PX_ROUTE_SPLIT_PATH || process.env.SHOPWARE_MODE === 'storefront' ? 'src/Resources/app/storefront/private/scss-route-split/*' : '';

// Create a glob regex to match the plugin prefixes
let prefixes = config.pluginPrefixes.split(',').map(p => `${p}*`).join('|');
const pluginSrcPath = Path.join(config.pluginsBasePath, `+(${prefixes})`);
const vendorSrcPath = Path.join(config.vendorBasePath, `+(${config.pluginPrefixes.replace(',', '|').toLowerCase()})`, '*');

const pluginMatch = new RegExp(`/plugins\/((${config.pluginPrefixes.replace(',', '|')})\\w*)\/`);
const vendorMatch = new RegExp(`/(vendor\/(${config.pluginPrefixes.replace(',', '|').toLowerCase()})\/[\\w-]*)\/`);
const routeSplitMatch = new RegExp(`/scss-route-split\/([\\w-]*)`);

export default {
    ...config,
    pluginSrcPath: Path.join(pluginSrcPath, pxEntryPath),
    pluginScssPath: Path.join(pluginSrcPath, pxEntryPath, config.scssFolder),
    pluginJsPath: Path.join(pluginSrcPath, pxEntryPath, config.jsFolder),

    vendorSrcPath: Path.join(vendorSrcPath, pxEntryPath),
    vendorScssPath: Path.join(vendorSrcPath, pxEntryPath, config.scssFolder),
    vendorJsPath: Path.join(vendorSrcPath, pxEntryPath, config.jsFolder),

    pluginMatch: pluginMatch,
    vendorMatch: vendorMatch,

    sharedScssPluginPath: Path.join(pluginSrcPath, pxEntryPath, config.pxSharedPath, config.scssFolder),
    sharedScssVendorPath: Path.join(vendorSrcPath, pxEntryPath, config.pxSharedPath, config.scssFolder),

    sharedIconPluginPath: Path.join(pluginSrcPath, pxEntryPath, config.pxSharedPath, config.iconsFolder),
    sharedIconVendorPath: Path.join(vendorSrcPath, pxEntryPath, config.pxSharedPath, config.iconsFolder),

    routeSplitMatch: routeSplitMatch,
    pluginRouteSplitPath: Path.join(pluginSrcPath, pxRouteSplitPath),
    vendorRouteSplitPath: Path.join(vendorSrcPath, pxRouteSplitPath),

    resourcesPath: process.env.RESOURCES_PATHS
}
