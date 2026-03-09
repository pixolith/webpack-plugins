const Fs = require('fs');
const Glob = require('glob');
const config = require('./config');
const production = require('./webpack.config.production');
const createStorefrontConfig = require('./webpack.config.storefront');
const createDevConfig = require('./webpack.config.dev');
const createAdministrationConfig = require('./webpack.config.administration');
const pkg = require('./../package.json');
const watcher = require('@pixolith/webpack-watcher');
const { merge } = require('webpack-merge');
const ChangeCase = require('change-case');

const setup = () => {
    watcher.clean(config);
    config.buildThemes.forEach((themeName) => {
        watcher.compileTheme(themeName, config);
    });

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
            themeNames: config.themeNames.join(', ') + (config.buildThemes.length < config.themeNames.length ? ' (building: ' + config.buildThemes.join(', ') + ')' : ''),
            version: pkg.version,
        });
    }
};

/**
 * Build per-theme resource paths for sass-resources-loader.
 *
 * Each theme gets:
 *   1. uses.scss (shared vendor utilities)
 *   2. vendor global resources (vendor/pxsw/...)
 *   3. all non-theme plugin _global_resources (custom/plugins + custom/static-plugins
 *      that are NOT in THEME_NAMES)
 *   4. this theme's _global_resources (overrides everything)
 *
 * Other themes' global resources are excluded to prevent style bleeding.
 *
 * @param {string} themeName - Theme name (e.g. 'PxswEbertTheme')
 * @param {Object} options
 * @param {string[]} options.uses - Paths to shared vendor uses.scss
 * @param {string[]} options.sharedVendorResourcePaths - Paths to shared vendor _global_resources
 * @returns {string[]} Array of SCSS resource paths
 */
const getResourcesPaths = (themeName, options) => {
    let uses = options.uses || [];
    let sharedVendorResourcePaths = options.sharedVendorResourcePaths || [];
    let paths = [].concat(uses, sharedVendorResourcePaths);
    let globalResourcesSuffix = '/src/Resources/app/_global_resources';
    let scssGlob = '/**/*.scss';

    // Collect base plugin global resources (plugins NOT in THEME_NAMES)
    let pluginDirs = ['custom/plugins', 'custom/static-plugins'];
    pluginDirs.forEach((dir) => {
        if (!Fs.existsSync(dir)) {
            return;
        }

        let entries = Fs.readdirSync(dir).filter((name) => {
            // Must match plugin prefix pattern
            let prefixes = (config.pluginPrefixes || 'Pxsw').split(',');
            let matchesPrefix = prefixes.some((p) =>
                name.startsWith(p.trim()),
            );
            if (!matchesPrefix) {
                return false;
            }
            // Exclude ALL themes from base pool — prevents style bleeding
            let isTheme = config.themeNames.some(
                (t) => name.indexOf(t) !== -1,
            );
            return !isTheme;
        });

        entries.forEach((name) => {
            let glob = dir + '/' + name + globalResourcesSuffix + scssGlob;
            if (Glob.sync(glob).length) {
                paths.push(glob);
            }
        });
    });

    // Add this theme's global resources LAST (overrides base)
    pluginDirs.forEach((dir) => {
        if (!Fs.existsSync(dir)) {
            return;
        }

        let themeGlob =
            dir + '/*' + themeName + '*' + globalResourcesSuffix + scssGlob;
        if (Glob.sync(themeGlob).length) {
            paths.push(themeGlob);
        }
    });

    return paths;
};

/**
 * Create an array of webpack configs, one per theme.
 * Each theme gets its own dev config (with per-theme resourcesPaths for
 * sass-resources-loader) and its own storefront config (with per-theme entry).
 *
 * @param {Object} options
 * @param {string[]} options.uses - Paths to shared vendor uses.scss
 * @param {string[]} options.sharedVendorResourcePaths - Paths to shared vendor _global_resources
 * @returns {Object[]} Array of webpack config objects (one per theme)
 */
const createThemeConfigs = (options) => {
    setup();

    return config.buildThemes.map((themeName, index) => {
        let resourcesPaths = getResourcesPaths(themeName, options);
        let themeSlug = ChangeCase.kebabCase(themeName);
        let themeOptions = {
            themeName: themeName,
            resourcesPaths: resourcesPaths,
        };

        let devCfg = createDevConfig(themeOptions);
        let storefrontCfg = createStorefrontConfig(themeOptions);
        let merged = merge(
            devCfg,
            storefrontCfg,
            config.isProd ? production : {},
        );

        // Only the first compiler should have devServer (webpack multi-compiler limitation)
        if (index > 0) {
            delete merged.devServer;
        }

        // Per-theme filesystem cache to avoid collisions between compilers
        merged.cache = {
            type: 'filesystem',
            name: themeSlug,
            buildDependencies: {
                config: [__filename],
            },
        };

        return merged;
    });
};

const setupAdministration = () => {
    watcher.clean(config);
    config.buildThemes.forEach((themeName) => {
        watcher.compileAdministration(themeName, config);
    });

    if (config.isDebug) {
        console.table({
            ...config,

            version: pkg.version,

            pluginMatch: config.pluginMatch.toString(),
            vendorMatch: config.vendorMatch.toString(),
            allowedExtensions: config.allowedExtensions.toString(),
        });
    } else {
        console.table({
            isProd: config.isProd,
            shopwareMode: config.shopwareMode,
            assetUrl: config.assetUrl,
            themeNames: config.themeNames.join(', ') + (config.buildThemes.length < config.themeNames.length ? ' (building: ' + config.buildThemes.join(', ') + ')' : ''),
            version: pkg.version,
        });
    }
};

/**
 * Create an array of webpack configs for administration, one per theme.
 * Each theme gets its own dev config (with per-theme resourcesPaths for
 * sass-resources-loader) and its own administration config (with per-theme
 * SCSS entries for theme-specific styling).
 *
 * @param {Object} options
 * @param {string[]} options.uses - Paths to shared vendor uses.scss
 * @param {string[]} options.sharedVendorResourcePaths - Paths to shared vendor _global_resources
 * @returns {Object[]} Array of webpack config objects (one per theme)
 */
const createAdminConfigs = (options) => {
    setupAdministration();

    return config.buildThemes.map((themeName, index) => {
        let resourcesPaths = getResourcesPaths(themeName, options);
        let themeSlug = ChangeCase.kebabCase(themeName);
        let themeOptions = {
            themeName: themeName,
            resourcesPaths: resourcesPaths,
        };

        let devCfg = createDevConfig(themeOptions);
        let adminCfg = createAdministrationConfig(themeOptions);
        let merged = merge(
            devCfg,
            adminCfg,
            config.isProd ? production : {},
        );

        // Only the first compiler should have devServer (webpack multi-compiler limitation)
        if (index > 0) {
            delete merged.devServer;
        }

        // Per-theme filesystem cache to avoid collisions between compilers
        merged.cache = {
            type: 'filesystem',
            name: themeSlug + '-admin',
            buildDependencies: {
                config: [__filename],
            },
        };

        return merged;
    });
};

module.exports = {
    createThemeConfigs: createThemeConfigs,
    createAdminConfigs: createAdminConfigs,
};
