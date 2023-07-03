const { Mixin } = Shopware;

Mixin.register('card-handling', {
    props: {
        watchKey: {
            default: 'repeater',
            type: String,
        }
    },

    computed: {
        elementConfig() {
            return this.element.config[this.watchKey]
                ? this.element.config[this.watchKey].value[this.index]
                : this.element.config;
        },
        elementData() {
            return this.element.config[this.watchKey]
                ? this.element.data[this.index]
                : this.element.data;
        },
        elementRules() {
            return this.element.config[this.watchKey]
                ? this.element.repeaterRules
                : this.element.configRules;
        }
    },

    methods: {
        allOptionsDisabled() {
            let options = [];
            this.fields.forEach((item) => {
                if (item && this.elementRules) {
                    if (
                        !this.elementRules[item] ||
                        !this.elementRules[item]._hidden
                    ) {
                        options.push(item);
                    }
                }
            });

            return options.length === 0;
        },
    },
});
