const { State } = Shopware;

export default class ElementConfigService {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }

    serviceIsInitiated() {
        return new Promise((resolve) => {
            if (this.getInit()) {
                resolve();
                return;
            }
            setTimeout(() => resolve(this.serviceIsInitiated()), 500);
        });
    }

    async getAllElementConfigs() {
        return await this.httpClient
            .get('/pxsw/config', this.getHeaders())
            .then((response) => {
                State.commit('context/addAppConfigValue', {
                    key: 'pxswElementConfig',
                    value: response.data,
                });

                State.commit('context/addAppConfigValue', {
                    key: 'pxswElementConfigIsInitialized',
                    value: true,
                });

                return response.data;
            });
    }

    async getElementConfig(component) {
        await this.serviceIsInitiated();

        let state = State._store.state.context.app.config;
        if (state.pxswElementConfig[component]) {
            return state.pxswElementConfig[component].config;
        }

        return await this.httpClient
            .get(`/pxsw/config/${component}`, this.getHeaders())
            .then((response) => {
                let currentState = state.pxswElementConfig;
                currentState[component] = response.data;

                State.commit('context/addAppConfigValue', {
                    key: 'pxswElementConfig',
                    value: currentState,
                });

                return response.data;
            });
    }

    async getElementRules(component) {
        await this.serviceIsInitiated();

        let state = State._store.state.context.app.config;
        if (state.pxswElementConfig[component]) {
            return state.pxswElementConfig[component].rules;
        }

        return await this.httpClient
            .get(`/pxsw/config/${component}`, this.getHeaders())
            .then((response) => {
                let currentState = state.pxswElementConfig;
                currentState[component] = response.data;

                State.commit('context/addAppConfigValue', {
                    key: 'pxswElementConfig',
                    value: currentState,
                });

                return response.data;
            });
    }

    getInit() {
        return State._store.state.context.app.config
            .pxswElementConfigIsInitialized && Shopware.Service('loginService').getToken();
    }

    getHeaders() {
        return {
            Accept: 'application/json',
            Authorization: `Bearer ${Shopware.Service(
                'loginService',
            ).getToken()}`,
            'Content-Type': 'application/json',
        };
    }
}
