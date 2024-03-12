let fs = require('fs');

if (process.env.SHOPWARE_MODE === 'storefront') {
    process.env.PLUGIN_PATH =
        './custom/plugins/Pxsw*/src/Resources/app/storefront/private';
    process.env.VENDOR_PATH =
        './vendor/pxsw/*/src/Resources/app/storefront/private';
    process.env.SHARED_SCSS_PATH = '../../shared';
    process.env.JS_TRANSPILE = JSON.stringify([]);
    process.env.PUBLIC_PATH = './public';
}

if (process.env.SHOPWARE_MODE === 'administration') {
    process.env.VENDOR_PATH = '';
    process.env.PLUGIN_PATH =
        './custom/plugins/Pxsw*/src/Resources/app/administration/src';
    process.env.SHARED_SCSS_PATH = '../../shared';
    process.env.PUBLIC_PATH = './public/bundles';
}

let sharedVendorResourcePaths = fs.existsSync('vendor/pxsw')
    ? ['vendor/pxsw/*/src/Resources/app/_global_resources/**/*.scss']
    : [];

let sharedPluginResourcePaths = fs.existsSync('custom/plugins')
    ? ['custom/plugins/Pxsw*/src/Resources/app/_global_resources/**/*.scss']
    : [];

let uses = fs.existsSync('custom/plugins/PxswProject/src/Resources/app/uses.scss')
    ? ['custom/plugins/PxswProject/src/Resources/app/uses.scss']
    : fs.existsSync('vendor/pxsw/project/src/Resources/app/uses.scss')
        ? ['vendor/pxsw/project/src/Resources/app/uses.scss']
        : [];

process.env.RESOURCES_PATHS = JSON.stringify([
    ...uses,
    ...sharedVendorResourcePaths,
    ...sharedPluginResourcePaths,
]);

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

module.exports = require('@pixolith/webpack-sw6-config')[
    process.env.SHOPWARE_MODE
];
