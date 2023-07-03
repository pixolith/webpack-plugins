const merge = require('deepmerge');

const { Application, Plugin } = Shopware;
const ServiceContainer = Application.getContainer('service');
const resolve = Plugin.addBootPromise();

const getRepeaterBlockDemoData = async function getRepeaterBlockDemoData(
    component,
    variant,
    iterations,
) {
    const config = await _getConfig(component, variant);

    resolve();

    const componentConfig = JSON.parse(JSON.stringify(config.defaultConfig));
    const repeaterConfig = JSON.parse(JSON.stringify(config.repeaterSet));
    componentConfig.variant.value = variant;

    if (iterations <= 1) {
        componentConfig.repeater.value.push(repeaterConfig);
        return componentConfig;
    }

    if (repeaterConfig.headline && repeaterConfig.headline.value) {
        Array.from({ length: iterations }, (x, i) => {
            let chunkConfig = JSON.parse(JSON.stringify(repeaterConfig));

            chunkConfig.headline.value += ' ' + (i + 1);
            componentConfig.repeater.value.push(chunkConfig);
        });

        return componentConfig;
    }

    Array.from({ length: iterations }, () => {
        let chunkConfig = JSON.parse(JSON.stringify(repeaterConfig));
        componentConfig.repeater.value.push(chunkConfig);
    });

    return componentConfig;
};

const _getConfig = async function _getConfig(component, variant) {
    const service = await _getPxswElementServiceContainer();

    const config = await service.getElementConfig(
        component,
    );

    if (variant === 'default' || !config[variant]) {
        return config.default;
    }

    return merge(config.default, config[variant]);
};
const _getPxswElementServiceContainer = function _getPxswElementServiceContainer() {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve) => {
        if (undefined !== ServiceContainer.pxswElementConfig) {
            resolve(ServiceContainer.pxswElementConfig);
            return;
        }

        setTimeout(() => resolve(_getPxswElementServiceContainer()), 500);
    });
};

export { getRepeaterBlockDemoData };
