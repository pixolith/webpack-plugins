module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                shippedProposals: true,
                corejs: 3,
                debug: false,
                useBuiltIns: 'usage',
                targets: {
                    browsers: require(process.cwd() + '/package.json')
                        .browserslist[
                        process.env.SHOPWARE_MODE +
                            (process.env.MODE ? ':modern' : '')
                    ],
                },
            },
        ],
    ],
    plugins: [
        '@babel/syntax-dynamic-import',
        '@babel/plugin-transform-runtime',
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-classes',
        '@babel/plugin-proposal-optional-chaining',
    ],
};
