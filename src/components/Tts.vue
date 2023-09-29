<template>
    <div class="d-flex align-center">
        <div class="d-flex align-center">
            <audio v-show="unplayedInQueue && store.audioEnabled" controls autoplay id="sound">
            </audio>
            <v-btn v-if="!smAndDown" @click="dialogs.tts = true" variant="text" icon="settings"></v-btn>
        </div>
        <div class="d-flex" :class="smAndDown ? 'mt-2 align-self-start' : ''">
            <v-btn v-if="smAndDown" @click="dialogs.tts = true" variant="text" icon="settings" density="compact"></v-btn>
            <v-btn variant="text" @click="() => playQueue()" :class="!smAndDown ? 'mr-4' : ''" class="text-body-2" :rounded="!smAndDown" :prepend-icon="smAndDown ? undefined : 'video_library'" :icon="smAndDown ? 'video_library' : undefined" :density="smAndDown ? 'compact' : undefined" v-if="unplayedInQueue && store.audioEnabled">
                <template v-slot:default v-if="!smAndDown">play queue</template>
            </v-btn>
            <v-btn variant="text" @click="audioButtonHandler" :class="!smAndDown ? 'mr-4' : ''" class="text-body-2" :rounded="!smAndDown" :prepend-icon="!smAndDown && store.audioEnabled ? 'volume_up' : 'volume_off'" :icon="smAndDown ? store.audioEnabled ? 'volume_up' : 'volume_off' : undefined" :density="smAndDown ? 'compact' : undefined">
                <template v-slot:default v-if="!smAndDown">{{ store.audioEnabled ? 'disable' : 'enable' }} audio</template>
            </v-btn>
        </div>
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : 700" v-model="dialogs.tts">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Setup text to speech</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">https://elevenlabs.io to get a FREE api key</v-card-subtitle>
                <v-card-text>
                    <v-form>
                        <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.XI_API_KEY" persistent-hint hint="Elevenlabs API Key" autocomplete="off" type="current-password" />
                        <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.voiceModel" persistent-hint hint="Elevenlabs voiceModel" />
                        <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.voiceId" persistent-hint hint="Elevenlabsl voiceId" />
                    </v-form>
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn prepend-icon="save" variant="tonal" @click="dialogs.tts = false">save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from '@/store/app'
import { mapSeries } from 'async'
import { useDisplay } from 'vuetify/lib/framework.mjs'

const unplayedInQueue = computed(() => {
    return store.audioQueue && Object.values(store.audioQueue).length ? Object.values(store.audioQueue).find(q => !q.played) : false
})
const dialogs = ref({
    tts: false
})
const { smAndDown } = useDisplay()
const { MODE } = import.meta.env
const debounces = ref({
    audioQueue: undefined,
    playQueue: undefined
})
const isMounted = ref(false)
const store = useAppStore()
function audioButtonHandler() {
    store.audioEnabled = !store.audioEnabled
    if (!store.audioEnabled) {
        window.speechSynthesis.cancel()
    }
}
function getSearchTTS(uuid) {
    const index = store.clSearches.findIndex(search => search.uuid === uuid)
    if (index !== -1) {
        return store.clSearches[index].tts
    }
}
function toggleSearchTTS(uuid) {
    const index = store.clSearches.findIndex(search => search.uuid === uuid)
    if (index !== -1) {
        // can remove this after change
        if (store.clSearches[index].tts === undefined) {
            store.clSearches[index].tts = true
        }
        store.clSearches[index].tts = !store.clSearches[index].tts
    }
}
function textToSpeech(pid, text) {
    if (!store.audioEnabled) return
    if (!store.elevenlabs.XI_API_KEY || !store.elevenlabs.voiceId || !store.elevenlabs.voiceModel) {
        textToSpeechSystem(pid, text)
    } else {
        textToSpeechElevenLabs(pid, text)
    }
}
function textToSpeechSystem(pid, text) {
    if (store.audioQueue[pid].played) return
    const utterance = new SpeechSynthesisUtterance(text)
    store.audioQueue[pid].played = 'system'
    utterance.onstart = async _event => {
        await playBell()
        window.speechSynthesis.resume()
    }
    window.speechSynthesis.speak(utterance)
    window.speechSynthesis.pause()
}
function textToSpeechElevenLabs(pid, text, retry = 0) {
    if (store.audioQueue[pid].base64) return
    const ws = new WebSocket(`wss://api.elevenlabs.io/v1/text-to-speech/${store.elevenlabs.voiceId}/stream-input?model_id=${store.elevenlabs.voiceModel}`)
    const audioChunks = []

    ws.onopen = function (event) {
        const bosMessage = {
            text: ' ',
            'xi_api_key': store.elevenlabs.XI_API_KEY
        }
        ws.send(JSON.stringify(bosMessage))

        ws.send(JSON.stringify({
            text: `${text} `,
            try_trigger_generation: true
        }))

        ws.send(JSON.stringify({
            "text": ''
        }))
    }
    ws.onerror = function (error) {
        console.error(`WebSocket Error: ${error}`)
    }
    ws.onmessage = function (event) {
        const response = JSON.parse(event.data)

        // console.log("Server response:", response)

        if (!response.audio) {
            console.log("No audio data in the response")
        }

        if (response.isFinal) {
            if (store.audioQueue[pid]) {
                const blob = new Blob(audioChunks, { type: 'audio/mpeg' })
                toBase64(blob, base64Encoded => {
                    store.audioQueue[pid] = {
                        ...store.audioQueue[pid],
                        base64: base64Encoded
                    }
                })

            }
        }

        if (response.audio) {
            const audioBlob = new Blob(
                [
                    new Uint8Array(
                        atob(response.audio)
                            .split("")
                            .map((char) => char.charCodeAt(0))
                    ),
                ],
                { type: "audio/mpeg" }
            )
            audioChunks.push(audioBlob)
        }
    }
    ws.onclose = function (event) {
        if (event.wasClean) {
            if (/max/i.test(event.reason) && retry < 3) {
                retry += 1
                setTimeout(() => textToSpeechElevenLabs(pid, text, retry), Math.random() * (30000 - 50000) + 50000)
            } else if (/quota/i.test(event.reason)) {
                textToSpeechSystem(pid, text)
            } else {
                console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`)
            }
        } else {
            console.warn('Connection died')
        }
    }
}
function toBase64(blob, callback) {
    const reader = new FileReader()
    reader.onload = function () {
        const base64String = btoa(reader.result)
        callback(base64String)
    }
    reader.readAsBinaryString(blob)
}
function base64ToDataUrl(base64String) {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })

    const dataUrl = URL.createObjectURL(blob)

    return dataUrl
}
async function playBell() {
    await new Promise(resolve => {
        const audioEl = document.getElementById('sound')
        audioEl.src = '/mixkit-page-forward-single-chime-1107.wav'
        audioEl.play()
        audioEl.onended = async event => {
            setTimeout(() => resolve(true))
        }
    })
}
async function play(queued) {
    await new Promise(resolve => {
        const audioEl = document.getElementById('sound')
        audioEl.src = base64ToDataUrl(queued.base64)
        audioEl.onended = async event => {
            await new Promise(r => setTimeout(r, 1000))
            resolve(true)
        }
        audioEl.oncomplete = async event => {
            await new Promise(r => setTimeout(r, 1000))
            resolve(true)
        }
        audioEl.onerror = error => resolve(false)
        audioEl.play()
    })
}
async function playQueue(queue) {
    if (debounces.value.playQueue) clearTimeout(debounces.value.playQueue)
    debounces.value.playQueue = setTimeout(async () => {
        const unplayed = Object.values(queue || store.audioQueue)
            .map(queued => {
                if (queued?.createdAt && (queued.createdAt > Date.now() + (60000 * 60))) {
                    console.log(`cleaning stale entry, created: ${new Date(queued.createdAt).toLocaleString()}, expired: ${Date.now() + (60000 * 60).toLocaleString()}`)
                    queue ? delete queue[queued.pid] : delete store.audioQueue[queued.pid]
                }
                return queued
            })
            .filter(queued => !queued.played)

        const withSound = unplayed.filter(u => u.base64)
        const withoutSound = unplayed.filter(u => !u.base64)
        await mapSeries(withSound, async queued => {
            const didPlay = await play(queued)
            if (didPlay) {
                // cleanup and remove played items
                store.audioQueue[queued.pid].played = 'ai'
            }
        })
        withoutSound.map(withoutSound => textToSpeechSystem(withoutSound.pid, withoutSound.title))
    }, 500)
}
defineExpose({
    textToSpeech,
    getSearchTTS,
    toggleSearchTTS,
    base64ToDataUrl
})
onMounted(() => {
    window.speechSynthesis.cancel()
    setTimeout(() => {
        isMounted.value = true, 11000
        if (MODE !== 'production') {
            const testPid = '0000000'
            store.audioQueue[testPid] = { pid: testPid }
            textToSpeechSystem(testPid, 'this is a test')
        }
    })
})
watch(store.audioQueue, async queue => {
    if (debounces.value.audioQueue) clearTimeout(debounces.value.audioQueue)
    debounces.value.audioQueue = setTimeout(() => {
        playQueue(queue)
    }, 1000)
}, {
    deep: true
})
</script>
