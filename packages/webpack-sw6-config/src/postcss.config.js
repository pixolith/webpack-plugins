module.exports = ({ file, options, env }) => {
    return {
        plugins: {
            // to edit target browsers: use "browserslist" field in package.json
            autoprefixer: {
                env: options.mode + (options.isModern ? ':modern' : ''),
            },
            'postcss-pxtorem': {
                rootValue: 16,
                unitPrecision: 5,
                propList: ['*']
            }
        },
    };
};
