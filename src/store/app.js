import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
    state: () => ({
        theme: 'light',
        textField: undefined,
        textFieldEmail: undefined,
        sessionId: undefined,
        splashed: false,
        subscribed: {
            daily: undefined
        },
        confirmed: undefined,
        banners: {
            share: {
                disabled: false
            }
        },
        settings: {
            alertCheckbox: false,
            emergencyContact: {
                from: undefined,
                contacts: [],
                messages: []
            },
            profile: {
                name: undefined
            }
        }
    }),
    persist: true,
})
