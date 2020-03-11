// file, options, env
module.exports = ({ options }) => {
    return {
        plugins: {
            // to edit target browsers: use "browserslist" field in package.json
            autoprefixer: {
                grid: true,
                env: options.mode + (options.isModern ? ':modern' : ''),
            },
            cssnano: {
                preset: [
                    'default',
                    {
                        discardComments: {
                            removeAll: true,
                        },
                    },
                ],
                zindex: false,
            },
        },
    };
};
