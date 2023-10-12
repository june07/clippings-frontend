import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
    state: () => ({
        theme: 'light',
        textField: undefined,
        sessionId: undefined,
        splashed: false
    }),
    persist: true,
})
