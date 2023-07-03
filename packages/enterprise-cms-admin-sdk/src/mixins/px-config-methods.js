const merge = require('deepmerge');

const { Application, Mixin } = Shopware;
const ServiceContainer = Application.getContainer('service');

Mixin.register('px-config-methods', {
    computed: {
        ec() {
            return this.element.config;
        },
        rc() {
            return this.element.config.repeater
                ? this.element.config.repeater.value
                : [];
        },
    },

    data() {
        return {
            repeaterCount: 0,
        };
    },

    async created() {
        this.createdComponent();
        await this.initiatePxswConfig();
    },

    methods: {
        mediaUrl(index, mediaField = 'media') {
            let assetsPath = Shopware.Context.api.assetsPath,
                elementConfig = index !== false && this.element.config.repeater
                    ? this.element.config.repeater.value[index]
                    : this.element.config,
                elementData = index !== false && this.element.config.repeater
                    ? this.element.data[index]
                    : this.element.data;

            if (!elementData || !elementData[mediaField]) {
                return `${assetsPath}/administration/static/img/cms/preview_mountain_large.jpg`;
            }

            let elemData = elementData[mediaField],
                mediaSource = elementConfig[mediaField].source;

            if (mediaSource === 'mapped') {
                const demoMedia = this.getDemoValue(
                    elementConfig[mediaField].value,
                );

                if (demoMedia && demoMedia.url) {
                    return demoMedia.url;
                }
            }

            if (elemData && elemData.id) {
                return elementData[mediaField].url;
            }

            if (elemData && elemData.url) {
                return `${assetsPath}${elemData.url}`;
            }

            return `${assetsPath}/administration/static/img/cms/preview_mountain_large.jpg`;
        },

        async loadConfig() {
            if (!this.pxswElementConfig) {
                this.pxswElementConfig = await ServiceContainer.pxswElementConfig.getElementConfig(
                    this.elementName,
                );
            }
            if (!this.pxswElementRules) {
                this.pxswElementRules = await ServiceContainer.pxswElementConfig.getElementRules(
                    this.elementName,
                );
            }
        },

        async initiatePxswConfig() {
            await this.loadConfig();
            this.element.variantOptions = this.pxswElementConfig;

            if (this.element.config.repeater) {
                if (!this.element.activeRepeaterIndex) {
                    await this.initiateRepeater();
                }
            }
            let variant = this.element.config.variant
                ? this.element.config.variant.value
                : '';

            if (!variant) {
                variant = 'default';
            }

            if (this.element.config.repeater) {
                this.loadActiveRepeaterSet(variant);
            }
            this.initiateElementRules();
        },

        async initiateRepeater() {
            await this.loadConfig();
            this.element.repeaterSet = this.pxswElementConfig.default.repeaterSet;
            this.element.repeaterRules = this.pxswElementRules.default.repeaterSet;

            this.element.activeRepeaterIndex = 0;
            this.repeaterCount = this.element.config.repeater.value.length;

            if (!this.element.data) {
                this.element.data = [];
                this.element.data[this.repeaterCount] = {};
            }

            if (this.repeaterCount === 0) {
                this.addSlide();
            }
        },

        initiateElementRules() {
            let variant = this.element.config.variant
                ? this.element.config.variant.value
                : '';

            if (!variant) {
                variant = 'default';
            }

            this.loadActiveRuleSet(variant);
        },

        loadActiveRepeaterSet(activeRepeaterSet) {
            this.element.activeRepeaterSet = merge(
                this.pxswElementConfig.default.repeaterSet,
                this.realCopy(
                    this.pxswElementConfig[activeRepeaterSet].repeaterSet,
                ),
            );
        },

        loadActiveRuleSet(activeRuleSet) {
            this.element.configRules = this.realCopy(
                this.pxswElementRules[activeRuleSet].defaultConfig,
            );

            if (this.element.config.repeater) {
                this.element.repeaterRules = this.realCopy(
                    this.pxswElementRules[activeRuleSet].repeaterSet,
                );
            }
        },

        changeVariantTo(variantKey) {
            if (this.element.config.repeater) {
                this.loadActiveRepeaterSet(variantKey);
            }

            this.loadActiveRuleSet(variantKey);
            this.changeConfigForVariant(variantKey);

            const save = this.activeTab;
            this.activeTab = '';
            this.$nextTick(() => {
                this.activeTab = save;
            });
        },

        changeConfigForVariant(activeVariantKey) {
            if (activeVariantKey === 'default') {
                return;
            }

            this.element.config = merge(
                this.element.config,
                this.realCopy(
                    this.pxswElementConfig[activeVariantKey].defaultConfig,
                ),
            );

            if (this.element.config.repeater) {
                this.element.config.repeater.value.forEach((val, index) => {
                    this.element.config.repeater.value[index] = merge(
                        this.element.config.repeater.value[index],
                        this.realCopy(
                            this.pxswElementConfig[activeVariantKey]
                                .repeaterSet,
                        ),
                    );
                });
            }

            this.$forceUpdate(); // TODO: SIMON this needs to be triggered as well in the tab components
        },

        realCopy(copyObject) {
            return JSON.parse(JSON.stringify(copyObject));
        },

        removeKeys(obj, keys, startsWith) {
            if (obj !== Object(obj)) {
                return obj;
            } else {
                return Array.isArray(obj)
                    ? obj.map((item) => this.removeKeys(item, keys, startsWith))
                    : Object.keys(obj)
                        .filter((k) =>
                            startsWith
                                ? k.indexOf(startsWith) !== 0
                                : !keys.includes(k),
                        )
                        .reduce(
                            (acc, x) =>
                                Object.assign(acc, {
                                    [x]: this.removeKeys(
                                        obj[x],
                                        keys,
                                        startsWith,
                                    ),
                                }),
                            {},
                        );
            }
        },

        addSlide() {
            this.element.config.repeater.value.push(this.element.repeaterSet);
            this.element.data[this.repeaterCount] = {};
            this.repeaterCount++;
        },
    },
});
