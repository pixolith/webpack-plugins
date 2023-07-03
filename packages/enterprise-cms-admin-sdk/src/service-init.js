import ElementConfigService from 'services/element-config';

Shopware.Application.addServiceProvider('pxswElementConfig', () => {
    const initContainer = Shopware.Application.getContainer('init');
    return new ElementConfigService(initContainer.httpClient);
});

Shopware.Application.getContainer(
    'service',
).pxswElementConfig.getAllElementConfigs();
