module.exports = ({ file, options, env }) => {
    return {
        minimizerOptions: {
            preset: [
                'default',
                {
                    discardComments: { removeAll: true },
                },
            ],
            zindex: false,
        },
        plugins: {
            // to edit target browsers: use "browserslist" field in package.json
            //autoprefixer: {
            //    grid: true,
            //    env: options.mode + (options.isModern ? ':modern' : ''),
            //},
        },
    };
};
