import Fs from 'fs';

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

export default async () => {
    if (process.env.SHOPWARE_MODE === 'storefront') {
        process.env.PUBLIC_PATH = './public';

        // browserslist config in package.json
        process.env.BROWSERSLIST_ENV = 'storefront';

        // activate mobile device splitting
        process.env.MEDIA_QUERIES = JSON.stringify({
            '(min-width: 768px)': 'desktop',
            '(min-width: 1024px)': 'desktop',
            '(min-width: 1280px)': 'desktop',
            '(min-width: 1440px)': 'desktop',
        });
    }

    if (process.env.SHOPWARE_MODE === 'administration') {
        process.env.PUBLIC_PATH = './public/bundles';

        // browserslist config in package.json
        process.env.BROWSERSLIST_ENV = 'administration';
    }

    let sharedVendorResourcePaths = Fs.existsSync('vendor/pxsw')
        ? ['vendor/pxsw/*/src/Resources/app/_global_resources/**/*.scss']
        : [];

    let sharedPluginResourcePaths = Fs.existsSync('custom/plugins')
        ? ['custom/plugins/Pxsw*/src/Resources/app/_global_resources/**/*.scss']
        : [];

    let uses = Fs.existsSync('custom/plugins/PxswProject/src/Resources/app/uses.scss')
        ? ['custom/plugins/PxswProject/src/Resources/app/uses.scss']
        : Fs.existsSync('vendor/pxsw/project/src/Resources/app/uses.scss')
            ? ['vendor/pxsw/project/src/Resources/app/uses.scss']
            : [];

    process.env.RESOURCES_PATHS = JSON.stringify([
        ...uses,
        ...sharedVendorResourcePaths,
        ...sharedPluginResourcePaths
    ]);

    const WebpackConfig = await import('@pixolith/webpack-sw6-config');

    return WebpackConfig[process.env.SHOPWARE_MODE === 'storefront' ? 'storefrontConfig' : 'administrationConfig'];
};
