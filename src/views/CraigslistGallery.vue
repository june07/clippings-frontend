<template>
    <v-container class="h-100 d-flex align-center flex-column" fluid>
        <div class="d-flex align-center">
            <div v-if="textToSpeechConfigured" class="d-flex align-center">
                <audio controls autoplay id="sound">
                    <source v-if="soundToPlay" :src="soundToPlay" type="audio/mpeg">
                </audio>
                <v-btn @click="dialogs.tts = true" variant="text" icon="settings"></v-btn>
            </div>
            <v-btn v-else @click="dialogs.tts = true" rounded>setup text to speech</v-btn>
            <v-btn variant="text" @click="dialogs.add = true" class="text-body-2" prepend-icon="add" v-if="!store.isLinkedDevice">add a new search</v-btn>
            <v-btn variant="text" @click="linkDeviceHandler" class="text-body-2" prepend-icon="sync" v-if="!store.isLinkedDevice">link device</v-btn>
            <v-chip v-else class="ml-4">linked to {{ store.linkCode }}</v-chip>
        </div>
        <v-sheet width="100%" v-for="(search, searchIndex) of store.clSearches">
            <audio :id="`sound-${search.uuid}`">
                <source v-if="sounds[search.uuid]" :src="sounds[search.uuid]" type="audio/mpeg">
            </audio>
            <v-row class="d-flex align-center">
                <v-col :cols="3" class="d-flex align-center text-caption">
                    <div class="text-no-wrap text-truncate" style="cursor: pointer" v-if="!editing[search.uuid]" @click="editing[search.uuid] = true">{{ search.name }}</div>
                    <v-text-field variant="outlined" density="compact" hide-details v-model="newSearchName" v-else @change="setSearchNameModel(search.uuid)" placeholder="Search Name" @mouseleave="editing[search.uuid] = false" />
                    <a :href="search.url" target="_blank" rel="noopener" class="ml-2">craigslist</a>
                    <div v-if="data[search.uuid]?.checked" class="ml-8">last checked {{ checked[search.uuid] }} ago</div>
                    <v-spacer />
                </v-col>
                <v-spacer />
                <v-btn v-if="searchIndex !== 0" variant="text" class="text-body-2" icon="arrow_upward" @click="sort('up', search.uuid)" />
                <v-btn v-if="searchIndex !== store.clSearches.length - 1" variant="text" class="text-body-2" icon="arrow_downward" @click="sort('down', search.uuid)" />
                <v-btn variant="text" class="text-body-2" prepend-icon="delete" @click="deleteHandler(search.uuid)">delete <span class="ml-2 font-italic font-weight-medium">{{ search.name }}</span></v-btn>
            </v-row>
            <v-slide-group class="pa-4" selected-class="bg-success" show-arrows="always" :class="hovering[search.uuid] ? '' : 'hide-arrows'" @mouseenter="hovering[search.uuid] = true" @mouseleave="hovering[search.uuid] = false">
                <v-slide-group-item v-for="(listing, index) of mostRecent(search.uuid)" :key="listing.pid" v-slot="{ isSelected, toggle, selectedClass }">
                    <div class="d-flex flex-column mx-1" :style="smAndDown ? 'width: 100px' : 'width: 250px'">
                        <v-icon class="new-icon" icon="newspaper" v-if="listing.time > Math.floor((Date.now() - (60000 * 10)) / 1000)" color="yellow" />
                        <v-card :color="listing.imageUrls?.length ? 'yellow-lighten-1' : 'grey-lighten-3'" rounded="xl">
                            <v-carousel transition="fade" :height="smAndDown ? 100 : 250" hide-delimiter-background :show-arrows="hovering[`${listing.pid} ${search.uuid}`] !== undefined && hovering[`${listing.pid} ${search.uuid}`]" @mouseenter="hovering[`${listing.pid} ${search.uuid}`] = true" @mouseleave="hovering[`${listing.pid} ${search.uuid}`] = false">
                                <span style="position: absolute; z-index: 1" class="text-caption ml-4">{{ listing.pid }}</span>
                                <v-carousel-item v-if="listing.imageUrls?.length" v-for="imageUrl of listing.imageUrls" :key="imageUrl">
                                    <v-img :height="smAndDown ? 100 : 250" :width="smAndDown ? 100 : 250" :src="imageUrl" cover style="border-radius: 12px">
                                        <template v-slot:placeholder>
                                            <div class="d-flex align-center justify-center fill-height">
                                                <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                                            </div>
                                        </template>
                                    </v-img>
                                </v-carousel-item>
                                <div class="d-flex justify-center align-center text-caption h-100" v-else>
                                    No image
                                </div>
                            </v-carousel>
                        </v-card>
                        <a class="text-body-2 text-truncate" :href="listing.href" target="_blank">{{ listing.title }}</a>
                        <div class="text-caption text-truncate">{{ listing.meta.join(' ') }}</div>
                    </div>
                </v-slide-group-item>
            </v-slide-group>
        </v-sheet>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="700" v-model="dialogs.add">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Add a new search</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Go ahead, do it!</v-card-subtitle>
                <v-card-text>
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newName" persistent-hint hint="name" placeholder="Any name you want" class="mb-4" />
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newUrl" persistent-hint hint="url" placeholder="Any Craigslist search URL" :rules="rules.url" />
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn prepend-icon="add" variant="tonal" @click="newSearchHandler">add</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="700" v-model="dialogs.link">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Link a device</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Enter the code from the device you want to link</v-card-subtitle>
                <v-card-text>
                    <p>On your device, go to <span class="font-weight-bold">craiglist.june07.com/link</span> and enter this code:</p>
                    <p class="text-h4 text-center" :class="linkSetup ? 'text-green' : ''">{{ store.linkCode }}</p>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="700" v-model="dialogs.linked">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Link this device</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Link this device.</v-card-subtitle>
                <v-card-text>
                    <v-row>
                        <v-col cols="3" class="d-flex justify-end align-center text-uppercase">Code</v-col>
                        <v-col>
                            <v-text-field hide-details v-model="store.linkCode" placeholder="Enter your link code" @input="store.linkCode = store.linkCode.toUpperCase()"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-btn class="d-flex mx-auto mt-8" @click="linkedDeviceHandler">link</v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="700" v-model="dialogs.tts">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Setup text to speech</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">https://elevenlabs.io to get a FREE api key</v-card-subtitle>
                <v-card-text>
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.XI_API_KEY" persistent-hint hint="Elevenlabs API Key" type="password" />
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.voiceModel" persistent-hint hint="Elevenlabs voiceModel" />
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="store.elevenlabs.voiceId" persistent-hint hint="urElevenlabsl voiceId" />
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn prepend-icon="save" variant="tonal" @click="dialogs.tts = false">save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
<style scoped>
.new-icon {
    position: absolute;
    z-index: 1;
    top: 36px;
    left: 36px;
}

:deep() .hide-arrows .v-slide-group__prev,
:deep() .hide-arrows .v-slide-group__next {
    display: none;
}
</style>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import * as cheerio from 'cheerio'
import prettyMilliseconds from 'pretty-ms'
import { VSlideGroup } from 'vuetify/components/VSlideGroup'
import { map } from 'async'
import draggable from 'vuedraggable'
import { watch } from 'vue'
import { v5 as uuidv5 } from 'uuid'
import { customAlphabet } from 'nanoid'

const { smAndDown } = useDisplay()
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 3)
const rules = {
    url: [
        (v) => !!v || `url is required.`,
        v => v && /https:\/\/.*\.craigslist\.org\/search\/.+/.test(v) || `url is not valid or not supported`
    ]
}
const { VITE_API_SERVER } = import.meta.env
const textToSpeechConfigured = computed(() => store.elevenlabs.XI_API_KEY && store.elevenlabs.voiceId && store.elevenlabs.voiceModel)
const linkSetup = ref(false)
const soundToPlay = ref()
const debounce = ref()
const audioQueue = ref({})
const isMounted = ref(false)
const interval = ref()
const checked = ref({})
const hovering = ref({})
const editing = ref({})
const sounds = ref({})
const newName = ref()
const newSearchName = ref()
const newUrl = ref()
const dialogs = ref({
    add: false,
    link: false,
    linked: false,
    tts: false
})
const store = useAppStore()
const maxListingsPerSearch = smAndDown ? 7 : 21
const data = ref({})
const ttsPidMap = ref({})
const sio = io(VITE_API_SERVER + '/cl', {
    transports: ['websocket'],
    path: '/ws',
    query: {}
})
    .on('audioQueue', queue => {
        if (store.isLinkedDevice) {
            const remoteQueue = JSON.parse(queue)
            audioQueue.value = Object.values(remoteQueue).reduce((queued, cur) => {
                if (cur.base64) {
                    cur.dataUrl = base64ToDataUrl(cur.base64)
                    return { ...queued, [cur.pid]: cur }
                } else {
                    return queued
                }
            }, {})
        }
    })
    .on('sync', () => {
        !store.isLinkedDevice && sio.emit('sync', JSON.stringify({
            clSearches: store.clSearches,
            elevenlabs: store.elevenlabs
        }))
    })
    .on('remoteState', (remoteState) => {
        if (store.isLinkedDevice) {
            store.$import(JSON.parse(remoteState), store)
        }
    })
    .on('linked', () => {
        dialogs.value.link = false
    })
    .on('connect_error', (error) => {
        console.log('CALLBACK ERROR: ' + error)
    })
    .on('error', reason => {
        console.log(reason)
    })

function sort(direction, url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        const search = store.clSearches.splice(index, 1).pop()
        store.clSearches.splice(direction === 'up' ? index - 1 : index, 0, search)
    }
}
function linkDeviceHandler() {
    dialogs.value.link = true
    store.linkCode = nanoid()
    sio.emit('link', store.linkCode, response => {
        if (/link setup/i.test(response)) {
            linkSetup.value = true
        }
    })
}
function linkedDeviceHandler() {
    sio.emit('linked', store.linkCode, response => {
        if (/linked/i.test(response)) {
            dialogs.value.linked = false
            store.isLinkedDevice = true
            sio.emit('sync')
        }
    })
}
function newSearchHandler() {
    store.clSearches.push({ name: newName.value || new Date().toLocaleString(), url: newUrl.value, uuid: uuidv5(newUrl.value, uuidv5.URL) })
    sio.emit('get', newUrl.value, (result) => {
        if (!result) return
        parse(result)
    })
    dialogs.value.add = false
}
function deleteHandler(url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        store.clSearches.splice(index, 1)
        sio.emit('delete', url)
    }
}
function setSearchNameModel(uuid) {
    const index = store.clSearches.findIndex(search => search.uuid === uuid)
    if (index !== -1) {
        store.clSearches[index].name = newSearchName.value
    }
    editing.value[uuid] = false
}
function estimateTimestampFromRelativeTime(relativeTime) {
    if (!relativeTime) return
    // Check for "N h ago" format
    const hoursAgoMatch = relativeTime.match(/^(\d+)\s*h\s+ago$/)
    if (hoursAgoMatch) {
        const hoursAgo = parseInt(hoursAgoMatch[1], 10)
        const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
        const estimatedTimestamp = currentTimestamp - hoursAgo * 3600 // Subtract hours in seconds
        return estimatedTimestamp
    }

    const minutessAgoMatch = relativeTime.match(/^(\d+)\s*mins\s+ago$/)
    if (minutessAgoMatch) {
        const minutessAgo = parseInt(minutessAgoMatch[1], 10)
        const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
        const estimatedTimestamp = currentTimestamp - minutessAgo * 60 // Subtract hours in seconds
        return estimatedTimestamp
    }

    // Check for "M/D" format (month/day)
    const dateMatch = relativeTime.match(/^(\d+)\/(\d+)$/)
    if (dateMatch) {
        const month = parseInt(dateMatch[1], 10)
        const day = parseInt(dateMatch[2], 10)

        // Assuming the year is the current year
        const currentYear = new Date().getFullYear()
        const estimatedTimestamp = Math.floor(
            new Date(currentYear, month - 1, day).getTime() / 1000
        ) // Convert to Unix timestamp
        return estimatedTimestamp
    }

    return null // Return null if the format doesn't match
}

function mostRecent(uuid) {
    const sorted = data.value[uuid]?.listings ? Object.values(data.value[uuid].listings).sort((a, b) => a.time > b.time ? -1 : 0) : []
    const mostRecent = sorted.length ? sorted.slice(0, maxListingsPerSearch) : []
    return mostRecent
}
function parse(result) {
    const { url, html } = result
    const uuid = uuidv5(url, uuidv5.URL)
    hovering.value[uuid] = false
    editing.value[uuid] = false
    const $ = cheerio.load(html)
    const $searchResults = $('li.cl-search-result')

    if (!data.value[uuid]) data.value[uuid] = {
        url,
        uuid,
        listings: {}
    }
    data.value[uuid].checked = Date.now()
    sounds.value[uuid] = '/323208_4347097-lq.mp3'

    $searchResults.each((_index, element) => {
        const pid = $(element).attr('data-pid')
        const href = $(element).find('.posting-title').attr('href')
        const title = $(element).find('.cl-app-anchor .label').text()
        const meta = $(element).find('.meta').text().split($(element).find('.separator').text())

        if (!pid || !title) return
        if (!data.value[uuid].listings[pid]) {
            if (isMounted.value) {
                // queue 
                if (!store.isLinkedDevice) {
                    audioQueue.value.pid = { pid, href, title }
                    textToSpeech(pid, title)
                }
            }
            data.value[uuid].listings[pid] = {
                pid,
                imageUrls: []
            }
        }

        $(element).find('.gallery-inner img').each((_index, element) => {
            const imageUrl = $(element).attr('src')
            if (imageUrl) {
                data.value[uuid].listings[pid].imageUrls = Array.from(new Set([...data.value[uuid].listings[pid].imageUrls, imageUrl]))
            }
        })
        data.value[uuid].listings[pid].href = href
        data.value[uuid].listings[pid].title = title
        data.value[uuid].listings[pid].meta = meta
        data.value[uuid].listings[pid].time = estimateTimestampFromRelativeTime(data.value[uuid].listings[pid].meta[0])
    })
    if (interval.value) clearInterval(interval.value)
    interval.value = setInterval(() => {
        if (data.value && Object.keys(data.value).length) {
            Object.values(data.value).forEach(listing => {
                checked.value[listing.uuid] = prettyMilliseconds(Date.now() - data.value[listing.uuid].checked, { compact: true })
            })

        }
    }, 1000)
}
onMounted(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const link = searchParams.get('link')

    store.linkCode = link || store.linkCode
    store.linkCode = store.linkCode?.toUpperCase()
    // reconnect a link on reload
    sio.emit('relink', store.linkCode, response => {
        console.log(response)
    })
    if (link) {
        dialogs.value.linked = true
    }
    sio.on('update', (result) => parse(result))
    if (!store.isLinkedDevice) {
        store.clSearches.forEach(search => {
            sio.emit('get', search.url, (result) => {
                if (!result) return
                parse(result)
            })
        })
    }
    setTimeout(() => isMounted.value = true, 11000)
})
async function play(queued) {
    const audioEl = document.getElementById('sound')
    soundToPlay.value = undefined
    soundToPlay.value = queued.dataUrl
    await audioEl.play()
}
function textToSpeech(pid, text, retry = 0) {
    if (!store.elevenlabs.XI_API_KEY || !store.elevenlabs.voiceId || !store.elevenlabs.voiceModel) return
    if (ttsPidMap.value[pid]) return
    if (debounce.value) clearTimeout(debounce.value)
    debounce.value = setTimeout(() => {
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
                if (audioQueue.value.pid) {
                    const blob = new Blob(audioChunks, { type: 'audio/mpeg' })
                    const dataUrl = URL.createObjectURL(blob)
                    toBase64(blob, base64Encoded => {
                        audioQueue.value.pid = {
                            ...audioQueue.value.pid,
                            base64: base64Encoded,
                            dataUrl
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
                    setTimeout(() => textToSpeech(pid, text, retry), Math.random() * (30000 - 50000) + 50000)
                } else {
                    ttsPidMap.value[pid] = new Date()
                    console.info(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`)
                }
            } else {
                console.warn('Connection died')
            }
        }
    }, 500)
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
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })

    const dataUrl = URL.createObjectURL(blob)

    return dataUrl
}

onBeforeUnmount(() => clearInterval(interval.value))
watch(audioQueue, async queue => {
    if (!store.isLinkedDevice) {
        sio.emit('audioQueue', JSON.stringify(queue))
    }
    const withSound = Object.values(queue).filter(queued => queued.dataUrl)
    await map(withSound, async queued => {
        await play(queued)
        await new Promise(resolve => setTimeout(resolve, 1000))
        // cleanup and remove played items
        delete audioQueue.value[queued.pid]
    })
}, {
    deep: true
})
</script>
