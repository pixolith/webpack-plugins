module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                shippedProposals: true,
                corejs: 3,
                debug: false,
                useBuiltIns: 'usage',
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
