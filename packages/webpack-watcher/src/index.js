const Fs = require('fs'),
    Path = require('path'),
    rimraf = require('rimraf'),
    Chokidar = require('chokidar'),
    Consola = require('consola'),
    Glob = require('glob'),
    ChangeCase = require('change-case');

let rampUpDone = false;

const watcher = {
    watch(config) {
        const fileList = [].concat(
            Glob.sync(config.pluginSrcPath),
            Glob.sync(config.sharedScssPluginPath),
            Glob.sync(config.vendorSrcPath),
            Glob.sync(config.sharedScssVendorPath),
        );

        const watcherInstance = Chokidar.watch(fileList, {
            persistent: true,
        });

        watcherInstance
            .on('add', (path) => watcher.onFileChange(path, config, 'add'))
            .on('unlink', (path) =>
                watcher.onFileChange(path, config, 'unlink'),
            )
            .on('error', (error) => Consola.error(`Watcher error: ${error}`))
            .on('ready', () => watcher.onFileChange(null, config, 'ready'));

        console.table(watcherInstance.getWatched());

        return watcher;
    },

    onFileChange(path, config, event) {
        if (!path) {
            Consola.info('Rebuilding Theme Index Files');
        }
        if (event === 'ready') {
            rampUpDone = true;
        }
        if (!rampUpDone && path) {
            return;
        }
        if (path) {
            Consola.info(`File changed: ${path}`);
        }

        config.buildThemes.forEach((themeName) => {
            Consola.info(`Compiling theme: ${themeName}`);
            watcher.compileTheme(themeName, config);
        });
    },

    clean(config) {
        Consola.info('Cleaning output folder');
        rimraf.sync(`${config.outputPath}/**/*.hot-update.*`, { glob: true });
    },

    walkTheLine(path) {
        if (!Fs.existsSync(path)) {
            return [];
        }

        let files = Fs.readdirSync(path)
            .filter((file) => file.charAt(0) !== '.')
            .filter((file) => !file.startsWith('async'))
            .filter((file) => file)
            .map((file) => {
                const subPath = path + '/' + file;
                if (Fs.lstatSync(subPath).isDirectory()) {
                    return watcher.walkTheLine(subPath);
                } else {
                    return subPath;
                }
            });

        return [].concat.apply([], files);
    },

    /**
     * Discover all plugin/vendor source directories and extract their names.
     * Scans custom/plugins, custom/static-plugins, and vendor/pxsw.
     * Returns array of { name: string, path: string, source: 'plugin'|'static-plugin'|'vendor' }
     */
    discoverPlugins(config) {
        let pluginDirs = Glob.sync(config.pluginSrcPath)
            .map((p) => {
                let match = p.match(config.pluginMatch);
                return match
                    ? { name: match[2], path: p, source: 'plugin' }
                    : null;
            })
            .filter(Boolean);

        let vendorDirs = Glob.sync(config.vendorSrcPath)
            .map((p) => {
                let match = p.match(config.vendorMatch);
                if (!match) {
                    return null;
                }
                let vendorName = match[1].split('/').pop();
                return { name: vendorName, path: p, source: 'vendor' };
            })
            .filter(Boolean);

        return [].concat(pluginDirs, vendorDirs);
    },

    /**
     * Discover all route-split directories across all plugin/vendor sources.
     * Returns array of { name: string, pluginName: string, path: string }
     */
    discoverRouteSplits(config) {
        let routeSplitDirs = [].concat(
            Glob.sync(config.pluginRouteSplitPath),
            Glob.sync(config.vendorRouteSplitPath),
        );

        let mapped = routeSplitDirs
            .map((p) => {
                let rsMatch = p.match(config.routeSplitMatch);
                let pluginMatch = p.match(config.pluginMatch);
                let vendorMatch = p.match(config.vendorMatch);
                let pluginName = pluginMatch
                    ? pluginMatch[2]
                    : vendorMatch
                      ? vendorMatch[1].split('/').pop()
                      : null;
                let source = pluginMatch
                    ? (p.indexOf('static-plugins') !== -1
                          ? 'static-plugin'
                          : 'plugin')
                    : 'vendor';

                return rsMatch && pluginName
                    ? {
                          routeName: rsMatch[1],
                          pluginName: pluginName,
                          path: p,
                          source: source,
                      }
                    : null;
            })
            .filter(Boolean);

        // Deduplicate by real path (vendor symlinks to static-plugins)
        let seenRealPaths = new Map();
        let deduplicated = [];

        mapped.forEach((entry) => {
            let realPath;
            try {
                realPath = Fs.realpathSync(entry.path);
            } catch (e) {
                realPath = entry.path;
            }

            let existing = seenRealPaths.get(realPath);
            if (!existing) {
                seenRealPaths.set(realPath, entry);
                deduplicated.push(entry);
            } else if (
                entry.source !== 'vendor' &&
                existing.source === 'vendor'
            ) {
                let idx = deduplicated.indexOf(existing);
                deduplicated[idx] = entry;
                seenRealPaths.set(realPath, entry);
            }
        });

        return deduplicated;
    },

    /**
     * Classify a plugin for theme builds.
     * Returns: 'target', 'other-theme', 'skip', or 'regular'
     *
     * In v12+, there is no 'base' classification. Everything that is not a theme
     * and not skipped is 'regular' and included in every theme build.
     */
    classifyPlugin(pluginName, themeName, config) {
        // Strip pxsw- prefix (and double pxsw-pxsw- from misnamed packages
        // like pxsw/pxsw-blog) to get a canonical slug for comparison.
        // Vendor names lack the prefix (enterprise-cms) while PascalCase
        // plugin names include it (PxswEnterpriseCms -> pxsw-enterprise-cms).
        let stripPrefix = (slug) =>
            slug.replace(/^(pxsw-)+/, '');

        let pluginSlug = stripPrefix(ChangeCase.kebabCase(pluginName));

        // Check if this plugin should be skipped entirely
        if (
            config.skipPlugins.some(
                (skip) =>
                    pluginSlug.indexOf(
                        stripPrefix(ChangeCase.kebabCase(skip)),
                    ) !== -1,
            )
        ) {
            return 'skip';
        }

        // Check target theme (this build's theme)
        let themeSlug = stripPrefix(ChangeCase.kebabCase(themeName));
        if (pluginSlug.indexOf(themeSlug) !== -1) {
            return 'target';
        }

        // Check if this is another theme (should be excluded from this build)
        let isOtherTheme = config.themeNames.some((t) => {
            let otherSlug = stripPrefix(ChangeCase.kebabCase(t));
            return t !== themeName && pluginSlug.indexOf(otherSlug) !== -1;
        });

        if (isOtherTheme) {
            return 'other-theme';
        }

        // Everything else is a regular plugin — included in all theme builds
        return 'regular';
    },

    /**
     * Collect all files from a directory, filtered by allowed extensions.
     * Excludes index.js/index.scss auto-generated files.
     */
    collectFiles(dirPath, config) {
        if (!Fs.existsSync(dirPath)) {
            return [];
        }

        return watcher
            .walkTheLine(dirPath)
            .sort((a, b) => {
                if (
                    a.indexOf('index.js') !== -1 &&
                    b.indexOf('index.js') !== -1
                ) {
                    if (a.split('/').length !== b.split('/').length) {
                        return b.split('/').length - a.split('/').length;
                    }
                    return a.localeCompare(b);
                }
                if (a.indexOf('index.js') !== -1) {
                    return 1;
                }
                if (b.indexOf('index.js') !== -1) {
                    return -1;
                }
                return a.localeCompare(b);
            })
            .filter((file) => {
                return (
                    file &&
                    !file.includes('index.js') &&
                    !file.includes('index.scss') &&
                    config.allowedExtensions.includes(Path.extname(file))
                );
            });
    },

    /**
     * Generate all entry files for a single theme:
     *   - index.js (consolidated JS from all included plugins)
     *   - index.scss (consolidated SCSS from all included plugins)
     *   - {route-name}.index.scss (per-route-split SCSS entries)
     *
     * Ordering: regular plugins first (alphabetical), target theme last (overrides).
     * Other themes and skip plugins are excluded.
     */
    compileTheme(themeName, config) {
        let allPlugins = watcher.discoverPlugins(config);
        let entryDir = Path.join(
            config.outputPath,
            '.theme-entries',
            ChangeCase.kebabCase(themeName),
        );

        if (Fs.existsSync(entryDir)) {
            // Clean stale storefront entry files before regenerating.
            // Preserve -admin.scss files written by compileAdministration
            // (concurrent builds share the same directory).
            Fs.readdirSync(entryDir).forEach((file) => {
                if (!file.endsWith('-admin.scss')) {
                    Fs.unlinkSync(Path.join(entryDir, file));
                }
            });
        } else {
            Fs.mkdirSync(entryDir, { recursive: true });
        }

        // Classify and collect files per plugin
        let pluginSources = allPlugins
            .map((plugin) => {
                let classification = watcher.classifyPlugin(
                    plugin.name,
                    themeName,
                    config,
                );

                if (
                    classification === 'skip' ||
                    classification === 'other-theme'
                ) {
                    if (config.isDebug) {
                        Consola.info(
                            `[${themeName}] Skipping ${plugin.name} (${classification})`,
                        );
                    }
                    return null;
                }

                let basePath = plugin.path;
                let scssPath = Path.join(basePath, config.scssFolder);
                let jsPath = Path.join(basePath, config.jsFolder);
                let sharedScssPath = Path.resolve(
                    basePath,
                    `${config.pxSharedPath}/${config.scssFolder}`,
                );
                let sharedIconPath = Path.resolve(
                    basePath,
                    `${config.pxSharedPath}/${config.iconsFolder}`,
                );

                // Collect SCSS files
                let scssFiles = watcher.collectFiles(scssPath, config);
                if (Fs.existsSync(sharedScssPath)) {
                    let sharedFiles = watcher.collectFiles(
                        sharedScssPath,
                        config,
                    );
                    scssFiles = sharedFiles.concat(scssFiles);
                }

                // Collect JS files
                let jsFiles = watcher.collectFiles(jsPath, config);

                // Include shared/vendor scss index in the SCSS entry (not JS)
                let scssEntry = Glob.sync(`${scssPath}/*index.scss`);
                if (scssEntry.length) {
                    scssFiles = scssFiles.concat(scssEntry);
                }

                let sharedScssEntry = Glob.sync(
                    Path.resolve(sharedScssPath, '*index.scss'),
                );
                if (sharedScssEntry.length) {
                    scssFiles = sharedScssEntry.concat(scssFiles);
                }

                // Include icons in storefront mode
                if (
                    config.shopwareMode === 'storefront' &&
                    Fs.existsSync(sharedIconPath)
                ) {
                    jsFiles = jsFiles.concat(
                        Glob.sync(Path.resolve(sharedIconPath, '*.svg')),
                    );
                }

                return {
                    plugin: plugin,
                    classification: classification,
                    scssFiles: scssFiles,
                    jsFiles: jsFiles,
                };
            })
            .filter(Boolean);

        // Order: regular plugins first, then target theme last (overrides)
        let ordered = [];
        pluginSources.forEach((s) => {
            if (s.classification === 'regular') {
                ordered.push(s);
            }
        });
        pluginSources.forEach((s) => {
            if (s.classification === 'target') {
                ordered.push(s);
            }
        });

        // Collect base SCSS files (shared + non-route-split) to prepend to 'base' route entry
        let baseScssFiles = [];
        ordered.forEach((s) => {
            s.scssFiles.forEach((file) => {
                baseScssFiles.push(file);
            });
        });

        // Write consolidated JS entry
        watcher._writeEntryFile(entryDir, 'index.js', ordered, 'js', config);

        // Handle route-split SCSS entries (base SCSS merged into 'base' route)
        watcher._compileRouteSplits(themeName, entryDir, config, baseScssFiles);

        if (config.isDebug) {
            Consola.info(
                `[${themeName}] Compiled entries with ${ordered.length} plugins:`,
            );
            console.table(
                ordered.map((s) => ({
                    plugin: s.plugin.name,
                    classification: s.classification,
                    scssFiles: s.scssFiles.length,
                    jsFiles: s.jsFiles.length,
                })),
            );
        }
    },

    /**
     * Write a consolidated entry file (index.js or index.scss) from ordered plugin sources.
     */
    _writeEntryFile(entryDir, filename, orderedSources, type, config) {
        let prefix = type === 'scss' ? "@import '" : "import '";
        let affix = "';\n";
        let fileKey = type === 'scss' ? 'scssFiles' : 'jsFiles';

        let allFiles = [];
        orderedSources.forEach((s) => {
            s[fileKey].forEach((file) => {
                allFiles.push(file);
            });
        });

        if (!allFiles.length) {
            return;
        }

        let buffer = '';
        allFiles.forEach((file) => {
            buffer += prefix + file + affix;
        });

        if (type === 'js') {
            buffer +=
                'if (module.hot) {\n' + '    module.hot.accept();\n' + '}\n';
        }

        Fs.writeFileSync(Path.join(entryDir, filename), buffer);
    },

    /**
     * Compile route-split SCSS entries for a theme.
     *
     * Discovers all scss-route-split/* directories across included plugins,
     * groups them by route name, and generates per-route entry files.
     * E.g., if PxswBasicTheme and PxswLoyalty both have scss-route-split/account/,
     * they are combined into a single {theme}/account.index.scss entry.
     */
    _compileRouteSplits(themeName, entryDir, config, baseScssFiles) {
        let allRouteSplits = watcher.discoverRouteSplits(config);

        // Group by route name, filtering by theme classification
        let routeGroups = {};

        allRouteSplits.forEach((rs) => {
            let classification = watcher.classifyPlugin(
                rs.pluginName,
                themeName,
                config,
            );

            if (classification === 'skip' || classification === 'other-theme') {
                return;
            }

            if (!routeGroups[rs.routeName]) {
                routeGroups[rs.routeName] = { regular: [], target: [] };
            }

            let files = watcher.collectFiles(rs.path, config).filter((file) => {
                return Path.extname(file) === '.scss';
            });

            if (files.length) {
                routeGroups[rs.routeName][classification].push({
                    pluginName: rs.pluginName,
                    files: files,
                });
            }
        });


        // Prepend base SCSS files (shared + non-route-split) to the 'base' route group
        if (baseScssFiles && baseScssFiles.length) {
            if (!routeGroups['base']) {
                routeGroups['base'] = { regular: [], target: [] };
            }
            routeGroups['base'].regular.unshift({
                pluginName: '_base-scss',
                files: baseScssFiles,
            });
        }

        // Write per-route entry files
        Object.keys(routeGroups).forEach((routeName) => {
            let group = routeGroups[routeName];
            let allFiles = [];

            // Regular plugins first, target theme last
            group.regular.forEach((s) => {
                allFiles = allFiles.concat(s.files);
            });
            group.target.forEach((s) => {
                allFiles = allFiles.concat(s.files);
            });

            if (!allFiles.length) {
                return;
            }

            let buffer = '';
            allFiles.forEach((file) => {
                buffer += "@import '" + file + "';\n";
            });

            let filename = routeName + '.index.scss';
            Fs.writeFileSync(Path.join(entryDir, filename), buffer);

            if (config.isDebug) {
                Consola.info(
                    `[${themeName}] Route-split ${routeName}: ${allFiles.length} files`,
                );
            }
        });
    },

    /**
     * Generate SCSS entry files for the administration build for a specific theme.
     *
     * Mirrors compileTheme logic: classifies plugins by theme (target/other-theme/
     * regular/skip), orders regular plugins first then target theme last.
     * For each included plugin, we collect:
     *   - shared SCSS (app/shared/scss/)
     *   - admin-specific SCSS (administration/src/px/scss/)
     * and write a single consolidated SCSS entry into
     * .theme-entries/{theme-slug}/{plugin-slug}-admin.scss.
     *
     * @param {string} themeName - Theme name from THEME_NAMES
     * @param {Object} config - Config object from config.js
     */
    compileAdministration(themeName, config) {
        let allPlugins = watcher.discoverPlugins(config);
        let themeSlug = ChangeCase.kebabCase(themeName);
        let entryDir = Path.join(
            config.outputPath,
            '.theme-entries',
            themeSlug,
        );

        // Ensure the entry directory exists and clean stale admin entry.
        // Only remove our own -admin.scss file — preserve storefront entries
        // (concurrent builds share the same directory).
        if (!Fs.existsSync(entryDir)) {
            Fs.mkdirSync(entryDir, { recursive: true });
        } else {
            let staleFile = Path.join(entryDir, themeSlug + '-admin.scss');
            if (Fs.existsSync(staleFile)) {
                Fs.unlinkSync(staleFile);
            }
        }

        // Classify and collect SCSS files per plugin
        let pluginSources = allPlugins
            .map((plugin) => {
                let classification = watcher.classifyPlugin(
                    plugin.name,
                    themeName,
                    config,
                );

                if (
                    classification === 'skip' ||
                    classification === 'other-theme'
                ) {
                    if (config.isDebug) {
                        Consola.info(
                            `[${themeName}/administration] Skipping ${plugin.name} (${classification})`,
                        );
                    }
                    return null;
                }

                let basePath = plugin.path;
                let scssPath = Path.join(basePath, config.scssFolder);
                let sharedScssPath = Path.resolve(
                    basePath,
                    `${config.pxSharedPath}/${config.scssFolder}`,
                );

                // Collect admin-specific SCSS
                let scssFiles = watcher.collectFiles(scssPath, config);

                // Collect shared SCSS (prepend so shared loads first)
                if (Fs.existsSync(sharedScssPath)) {
                    let sharedFiles = watcher.collectFiles(
                        sharedScssPath,
                        config,
                    );
                    scssFiles = sharedFiles.concat(scssFiles);
                }

                // Include vendor/shared index.scss files
                let scssEntry = Glob.sync(`${scssPath}/*index.scss`);
                if (scssEntry.length) {
                    scssFiles = scssFiles.concat(scssEntry);
                }

                let sharedScssEntry = Glob.sync(
                    Path.resolve(sharedScssPath, '*index.scss'),
                );
                if (sharedScssEntry.length) {
                    scssFiles = sharedScssEntry.concat(scssFiles);
                }

                return {
                    plugin: plugin,
                    classification: classification,
                    slug: ChangeCase.kebabCase(plugin.name),
                    scssFiles: scssFiles,
                };
            })
            .filter(Boolean);

        // Order: regular plugins first, then target theme last (overrides)
        let ordered = [];
        pluginSources.forEach((s) => {
            if (s.classification === 'regular') {
                ordered.push(s);
            }
        });
        pluginSources.forEach((s) => {
            if (s.classification === 'target') {
                ordered.push(s);
            }
        });

        // Write a single consolidated SCSS entry for this theme
        let allScssFiles = [];
        ordered.forEach((s) => {
            s.scssFiles.forEach((file) => {
                allScssFiles.push(file);
            });
        });

        if (allScssFiles.length) {
            let buffer = '';
            allScssFiles.forEach((file) => {
                buffer += "@import '" + file + "';\n";
            });

            let filename = themeSlug + '-admin.scss';
            Fs.writeFileSync(Path.join(entryDir, filename), buffer);
        }

        if (config.isDebug) {
            Consola.info(
                `[${themeName}/administration] Compiled SCSS entries for ${ordered.length} plugins:`,
            );
            console.table(
                ordered.map((s) => ({
                    plugin: s.plugin.name,
                    classification: s.classification,
                    scssFiles: s.scssFiles.length,
                })),
            );
        }
    },
};

module.exports = watcher;
