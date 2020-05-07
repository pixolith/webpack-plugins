module.exports = {
    extends: 'stylelint-prettier/recommended',
    rules: {
        'at-rule-empty-line-before': null,
        'at-rule-no-unknown': null,
        'color-hex-length': null,
        'comment-empty-line-before': null,
        'comment-whitespace-inside': null,
        'function-comma-space-after': null,
        'declaration-empty-line-before': null,
        'declaration-colon-newline-after': null,
        'declaration-block-no-redundant-longhand-properties': null,
        'length-zero-no-unit': null,
        'no-descending-specificity': null,
        'max-nesting-depth': 8,
        'selector-pseudo-element-colon-notation': null,
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
        'selector-type-no-unknown': null,
    },
};
