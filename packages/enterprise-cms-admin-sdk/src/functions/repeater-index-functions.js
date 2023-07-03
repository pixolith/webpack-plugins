const Criteria = Shopware.Data.Criteria;

const collect = function collect(elem) {
    const criteriaList = {};

    Object.keys(elem.config.repeater.value).forEach((index) => {
        Object.keys(elem.config.repeater.value[index]).forEach((configKey) => {
            if (
                elem.config.repeater.value[index][configKey].source === 'mapped'
            ) {
                return;
            }

            const entity = elem.config.repeater.value[index][configKey].entity;

            if (
                entity &&
                entity.name === 'media' &&
                elem.config.repeater.value[index][configKey].value
            ) {
                const entityData = getRepeatingData(elem, index, configKey);

                entityData.searchCriteria.setIds(entityData.value);

                criteriaList[`entity-${entityData.key}-${index}`] = entityData;
            }
        });
    });

    return criteriaList;
};
const enrich = function enrich(elem, data) {
    if (Object.keys(data).length < 1) {
        return;
    }

    Object.keys(elem.config.repeater.value).forEach((index) => {
        elem.data[index] = [];

        Object.keys(elem.config.repeater.value[index]).forEach((configKey) => {
            const entity = elem.config.repeater.value[index][configKey].entity;
            if (!entity) {
                return;
            }

            const entityData = getRepeatingData(elem, index, configKey);

            if (!data[`entity-${entityData.key}-${index}`]) {
                return;
            }

            elem.data[index][configKey] = data[
                `entity-${entityData.key}-${index}`
            ].get(elem.config.repeater.value[index][configKey].value);
        });
    });
};
const getRepeatingData = function getRepeatingData(element, index, configKey) {
    const entity = element.config.repeater.value[index][configKey].entity;
    const configValue = element.config.repeater.value[index][configKey].value;
    let entityData = {};

    // if multiple entities are given in a slot
    if (Array.isArray(configValue)) {
        const entityIds = [];

        if (configValue[0].mediaId) {
            configValue.forEach((val) => {
                entityIds.push(val.mediaId);
            });
        } else {
            entityIds.push(...configValue);
        }

        entityData = {
            value: entityIds,
            key: configKey,
            ...entity,
        };
    } else {
        entityData = {
            value: [configValue],
            key: configKey,
            ...entity,
        };
    }

    entityData.searchCriteria = entity.criteria
        ? entity.criteria
        : new Criteria();

    return entityData;
};

export { collect, enrich, getRepeatingData };
