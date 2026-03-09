let Fs = require('fs');

if (process.env.SHOPWARE_MODE === 'storefront') {
    process.env.PUBLIC_PATH = './public';

    // browserslist config in package.json
    process.env.BROWSERSLIST_ENV = 'storefront';

    // all themes in the project split by comma (used for entrypoint generation)
    process.env.THEME_NAMES = 'PxswBasicTheme';

    // activate mobile device splitting
    //process.env.MEDIA_QUERIES = JSON.stringify({
    //    '(min-width: 768px)': 'desktop',
    //    '(min-width: 1024px)': 'desktop',
    //    '(min-width: 1280px)': 'desktop',
    //    '(min-width: 1440px)': 'desktop',
    //});
}

if (process.env.SHOPWARE_MODE === 'administration') {
    process.env.PUBLIC_PATH = './public/bundles';

    // browserslist config in package.json
    process.env.BROWSERSLIST_ENV = 'administration';

    // all themes in the project split by comma (used for entrypoint generation)
    process.env.THEME_NAMES = 'PxswBasicTheme';
}

if (
    !(
        process.env.SHOPWARE_MODE === 'storefront' ||
        process.env.SHOPWARE_MODE === 'administration'
    )
) {
    process.stderr.write(
        'SHOPWARE_MODE needs to be storefront or administration',
    );
    process.exit(1);
}

let themeNames = process.env.THEME_NAMES
    ? process.env.THEME_NAMES.split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    : [];

if (!themeNames.length) {
    process.stderr.write(
        'THEME_NAMES is required. Set at least one theme name, e.g. THEME_NAMES=PxswBasicTheme\n',
    );
    process.exit(1);
}

let sharedVendorResourcePaths = Fs.existsSync('vendor/pxsw')
    ? ['vendor/pxsw/*/src/Resources/app/_global_resources/**/*.scss']
    : [];

let uses = Fs.existsSync('vendor/pxsw/project/src/Resources/app/uses.scss')
    ? ['vendor/pxsw/project/src/Resources/app/uses.scss']
    : [];

process.env.RESOURCES_PATHS = JSON.stringify([
    ...uses,
    ...sharedVendorResourcePaths,
]);

let sw6Config = require('@pixolith/webpack-sw6-config');

let resourceOptions = {
    uses: uses,
    sharedVendorResourcePaths: sharedVendorResourcePaths,
};

if (process.env.SHOPWARE_MODE === 'storefront') {
    module.exports = sw6Config.createThemeConfigs(resourceOptions);
} else {
    module.exports = sw6Config.createAdminConfigs(resourceOptions);
}
