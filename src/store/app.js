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
        confirmed: undefined
    }),
    persist: true,
})
