import { defineStore } from "pinia"

export const useAppStore = defineStore("app", {
    state: () => ({
        clSearches: [],
        isLinkedDevice: false,
        linkCode: undefined,
        elevenlabs: {
            XI_API_KEY: undefined,
            voiceId: undefined,
            voiceModel: undefined,
        },
        audioQueue: {},
        audioEnabled: true,
        maxTTSPerSearch: 1,
        sessionId: undefined,
        $import: (remoteStore, state) => {
            Object.entries(remoteStore).forEach(kv => state[kv[0]] = kv[1])
        },
    }),
    persist: true,
})
