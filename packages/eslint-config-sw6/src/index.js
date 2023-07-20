module.exports = {
    root: true,
    parser: 'babel-eslint',
    env: {
        browser: true,
        node: true,
        es6: true,
        es2020: true,
    },
    globals: {
        Shopware: true,
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    extends: [
        'eslint:recommended',
        'plugin:json-schema-validator/recommended'
    ],
    // add your custom rules here
    rules: {
        // indent is done with prettier
        indent: 0,
        quotes: [2, 'single', 'avoid-escape'],
        'brace-style': [2, '1tbs'],
        'comma-dangle': [2, 'only-multiline'],
        'consistent-return': 2,
        'linebreak-style': [2, 'unix'],
        semi: [2, 'always'],
        'no-console': 0,
        'no-undef': 2,
        'no-shadow': 0,
        'no-unused-vars': 2,
        'no-bitwise': 2,
        'eol-last': 2,
        'dot-notation': 2,
        'dot-location': [2, 'property'],
        eqeqeq: [2, 'allow-null'],
        'no-inner-declarations': [2, 'functions'],
        'no-multi-spaces': 2,
        'no-unused-expressions': 2,
        'keyword-spacing': 2,
        'space-before-blocks': 2,
        'require-atomic-updates': 'off',
        'space-before-function-paren': [
            2,
            { anonymous: 'never', named: 'never' },
        ],
        strict: [2, 'global'],
        'require-await': 2,
    },
};
