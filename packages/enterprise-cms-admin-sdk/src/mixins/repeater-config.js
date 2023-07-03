const { Mixin } = Shopware;

Mixin.register('repeater-config', {
    methods: {
        updatePreviewImage() {
            let radioWrappers = document.getElementsByClassName(
                'image-radio-wrapper',
            );

            for (let i = 0; i < radioWrappers.length; i++) {
                let radioButtons = radioWrappers[i].querySelectorAll(
                    '.sw-field__radio-state',
                );

                for (let j = 0; j < radioButtons.length; j++) {
                    radioButtons[j].style.backgroundImage =
                        'url(' +
                        this.mediaUrl(this.element.activeRepeaterIndex) +
                        ')';
                }
            }
        },

        handleOnlyFirstValues() {
            if (!this.element.repeaterRules) {
                return;
            }

            Object.keys(this.element.repeaterRules).forEach((key) => {
                if (this.element.repeaterRules[key]._onlyFirst === true) {
                    this.element.config.repeater.value.forEach(
                        (val, repeaterKey) => {
                            this.element.config.repeater.value[repeaterKey][
                                key
                            ].value = this.element.config.repeater.value[0][
                                key
                            ].value;
                        },
                    );
                }
            });
        },
    },

    mounted() {
        this.$nextTick(() => {
            this.updatePreviewImage();

            const sideBarRefs = this.$refs.pxSidebar;

            if (!this.element.variantOptions) {
                return;
            }

            if (
                Object.keys(this.element.variantOptions).length <= 1 ||
                (this.element.config.variant &&
                    this.element.config.variant.value !== 'default')
            ) {
                sideBarRefs.setItemActive(sideBarRefs.items[2]);
                return;
            }
            sideBarRefs.setItemActive(sideBarRefs.items[0]);
        });
    },

    watch: {
        'element.config.repeater.value': {
            deep: true,
            handler() {
                this.handleOnlyFirstValues();
                this.$forceUpdate();
            },
        },
        activeTab: function(newValue) {
            if (newValue === 'presentation' || newValue === 'media') {
                let that = this;

                setTimeout(function() {
                    that.updatePreviewImage();
                }, 0);
            }
        },
        'element.activeRepeaterIndex': {
            deep: true,
            handler() {
                let that = this;

                setTimeout(function() {
                    that.updatePreviewImage();
                }, 0);
            },
        },
    },
});
