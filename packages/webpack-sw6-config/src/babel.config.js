module.exports = {
    presets: [
        [
            '@babel/env',
            {
                shippedProposals: true,
                corejs: 3,
                debug: false,
                useBuiltIns: 'usage',
                targets: {
                    browsers: require(process.cwd() + '/package.json')
                        .browserslist[
                        process.env.SHOPWARE_MODE + process.env.MODE
                            ? ':modern'
                            : ''
                    ],
                },
            },
        ],
    ],
    plugins: [
        '@babel/syntax-dynamic-import',
        '@babel/proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
    ],
};
