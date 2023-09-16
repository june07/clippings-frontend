/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../store'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import api from './api'

pinia.use(piniaPluginPersistedstate)

export function registerPlugins(app) {
    app
        .use(vuetify)
        .use(pinia)
        .use(api)
}
