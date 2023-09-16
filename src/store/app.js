import { defineStore } from "pinia"

const { MODE } = import.meta.env

export const useAppStore = defineStore("app", {
    state: () => ({
        clSearches: []
    }),
    persist: true,
})
