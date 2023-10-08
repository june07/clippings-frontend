import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
    state: () => ({
        textField: undefined,
        sessionId: undefined
    }),
    persist: true,
})
