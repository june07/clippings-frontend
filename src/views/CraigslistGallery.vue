<template>
    <v-container class="h-100 d-flex align-center flex-column" fluid>
        <div class="d-flex align-center justify-center mb-4" :class="smAndDown ? 'flex-column' : ''">
            <Tts ref="tts" />
            <v-btn variant="text" rounded @click="dialogs.add = true" class="text-body-2" prepend-icon="add" v-if="!store.isLinkedDevice">new search</v-btn>
            <v-btn variant="text" rounded @click="searchesHandler" class="text-body-2" prepend-icon="list">trending searches</v-btn>
            <v-btn variant="text" rounded @click="linkDeviceHandler" class="text-body-2" prepend-icon="link" v-if="!store.isLinkedDevice && !smAndDown">link device</v-btn>
            <v-chip v-else-if="store.linkCode" class="mx-4" :class="smAndDown ? 'mt-2' : ''">linked to {{ store.linkCode }}</v-chip>
            <v-btn variant="text" rounded @click="unlinkDeviceHandler" class="text-body-2" prepend-icon="link_off" v-if="store.isLinkedDevice && !smAndDown">unlink device</v-btn>
        </div>
        <!-- searches start -->
        <v-sheet width="100%" v-for="(search, searchIndex) of store.clSearches">
            <v-row class="d-flex align-center">
                <v-col :cols="3" class="d-flex align-center text-body-2">
                    <div class="text-no-wrap" style="cursor: pointer" v-if="!editing[search.uuid]" @click="editing[search.uuid] = true">{{ search.name }}</div>
                    <v-text-field variant="outlined" density="compact" hide-details v-model="newSearchName" v-else @change="setSearchNameModel(search.uuid)" placeholder="Search Name" @mouseleave="editing[search.uuid] = false" />
                    <a :href="search.url" target="_blank" rel="noopener" class="ml-2">{{ smAndDown ? 'cl' : 'craigslist' }}</a>
                    <div v-if="lastChecked[search.uuid] && !smAndDown" class="ml-8 text-no-trunc text-no-wrap">updated {{ lastChecked[search.uuid].timeAgo }} ago</div>
                    <div v-else-if="data[search.uuid]?.updatedAt" class="ml-4 text-no-wrap">{{ data[search.uuid].updatedAt }}</div>
                    <v-spacer />
                </v-col>
                <v-spacer />
                <v-btn v-if="tts" variant="text" class="text-body-2" :icon="tts.getSearchTTS(search.uuid) ? 'volume_up' : 'volume_off'" @click="tts.toggleSearchTTS(search.uuid)" :density="smAndDown ? 'compact' : undefined" />
                <v-btn v-if="searchIndex !== 0" variant="text" class="text-body-2" icon="arrow_upward" @click="sort('up', search.uuid)" :density="smAndDown ? 'compact' : undefined" />
                <v-btn v-if="searchIndex !== store.clSearches.length - 1" variant="text" class="text-body-2" icon="arrow_downward" @click="sort('down', search.uuid)" :density="smAndDown ? 'compact' : undefined" />
                <v-btn variant="text" class="text-body-2" prepend-icon="delete" @click="deleteHandler(search.uuid)" :density="smAndDown ? 'compact' : undefined" :icon="smAndDown ? 'delete' : undefined" :rounded="!smAndDown">
                    <template v-slot:default v-if="!smAndDown">delete</template>
                </v-btn>
            </v-row>
            <v-slide-group class="pa-4" selected-class="bg-success" show-arrows="always" :class="hovering[search.uuid] ? '' : 'hide-arrows'" @mouseenter="hovering[search.uuid] = true" @mouseleave="hovering[search.uuid] = false">
                <v-slide-group-item v-for="(listing, index) of mostRecent[search.uuid]" :key="`${listing.pid} ${search.uuid}`" v-slot="{ isSelected, toggle, selectedClass }">
                    <div class="d-flex flex-column mx-1" :style="smAndDown ? 'width: 100px' : 'width: 250px'">
                        <v-card :color="listing.imageUrls?.length ? 'yellow-lighten-1' : 'grey-lighten-3'" rounded="xl">
                            <v-carousel v-show="!showComments[listing.pid]" transition="fade" :height="smAndDown ? 100 : 250" hide-delimiter-background :show-arrows="hovering[`${listing.pid} ${search.uuid}`] !== undefined && hovering[`${listing.pid} ${search.uuid}`]" @mouseenter="hovering[`${listing.pid} ${search.uuid}`] = true" @mouseleave="hovering[`${listing.pid} ${search.uuid}`] = false">
                                <div style="position: absolute; z-index: 1" class="d-flex align-center">
                                    <span class="text-caption ml-4 text-white">{{ listing.pid }}</span>
                                    <v-btn v-if="!commentsCount[listing.pid]" size="small" density="compact" variant="text" icon="comment" color="white" @click="showComments[listing.pid] = true" />
                                    <v-badge v-else location="bottom" color="rgba(255, 255, 255, 0.7)" offset-y="-12">
                                        <template v-slot:badge>
                                            <span class="text-caption font-weight-bold">{{ commentsCount[listing.pid] }}</span>
                                        </template>
                                        <v-btn size="small" density="compact" variant="text" icon="comment" color="white" @click="showComments[listing.pid] = true" />
                                    </v-badge>
                                    <v-btn size="small" density="compact" variant="text" icon="unarchive" color="white" @click="archiveHandler(listing.href)" />
                                </div>
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
                        <v-btn size="x-small" v-if="showComments[listing.pid]" variant="text" prepend-icon="comment" @click="showComments[listing.pid] = false">close</v-btn>
                        <Giscus class="giscus" v-if="showComments[listing.pid]" repo="june07/jc-comments" repo-id="R_kgDOKZ-3jA" category="Announcements" category-id="DIC_kwDOKZ-3jM4CZvZb" mapping="specific" :term="listing.pid" strict="0" reactions-enabled="1" emit-metadata="1" input-position="bottom" theme="preferred_color_scheme" lang="en" />
                    </div>
                </v-slide-group-item>
            </v-slide-group>
        </v-sheet>
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : 700" v-model="dialogs.add">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Add a new search</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Go ahead, do it!</v-card-subtitle>
                <v-card-text>
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newName" persistent-hint hint="name" placeholder="Any name you want (defaults to the date)" class="mb-4" />
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newUrl" persistent-hint hint="url" placeholder="Any Craigslist search URL" :rules="rules.url" />
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn prepend-icon="add" variant="tonal" @click="() => newSearchHandler()">add</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : 700" v-model="dialogs.link">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Link a device</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Enter the code from the device you want to link</v-card-subtitle>
                <v-card-text>
                    <p>On your device, go to <span class="font-weight-bold">jc.june07.com/#link</span> and enter this code:</p>
                    <p class="text-h4 text-center" :class="linkSetup ? 'text-green' : ''">{{ store.linkCode }}</p>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : 700" v-model="dialogs.linked">
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
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : 700" v-model="dialogs.searches">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Trending searches</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Watch the searches that other users are watching.</v-card-subtitle>
                <v-card-text>
                    <v-list>
                        <v-list-item v-for="(search, index) of searches" :key="search.url">
                            <div class="d-flex text-body-2 justify-center">
                                #<span class="font-weight-medium mr-4">{{ index + 1 }}</span>{{ search.metadata.title }}
                            </div>
                            <template v-slot:append>
                                <v-btn variant="text" size="small" prepend-icon="add" @click="newSearchHandler(search.metadata.title, search.url)" :disabled="store.clSearches.find(s => s.uuid === search.uuid) ? true : false">add</v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                    <v-btn class="d-flex mx-auto mt-8" @click="dialogs.searches = false">close</v-btn>
                </v-card-text>
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
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import { VSlideGroup } from 'vuetify/components/VSlideGroup'
import { watch } from 'vue'
import { v5 as uuidv5 } from 'uuid'
import prettyMilliseconds from 'pretty-ms'
import cookie from 'cookie'
import Giscus from '@giscus/vue'

import Tts from '@/components/Tts.vue'

const { $api } = getCurrentInstance().appContext.config.globalProperties
const tts = ref(null)
const mostRecent = ref({})
const interval = ref()
const { MODE } = import.meta.env
const { smAndDown } = useDisplay()
const rules = {
    url: [
        (v) => !!v || `url is required.`,
        v => v && /https:\/\/.*\.craigslist\.org\/search\/.+/.test(v) || `url is not valid or not supported`
    ]
}
const { VITE_API_SERVER } = import.meta.env
const linkSetup = ref(false)
const debounces = ref({
    audioQueue: undefined,
})
const lastChecked = ref({})
const isMounted = ref(false)
const hovering = ref({})
const editing = ref({})
const newName = ref()
const newSearchName = ref()
const newUrl = ref()
const dialogs = ref({
    add: false,
    link: false,
    linked: false,
    tts: false,
    searches: false
})
const searches = ref([])
const lastTTSSearch = ref()
const store = useAppStore()
const maxListingsPerSearch = smAndDown.value ? 7 : 21
const data = ref({})
const showComments = ref({})
const commentsCount = ref({})
const sio = io(VITE_API_SERVER + '/', {
    transports: ['websocket']
})
    .on('audioQueue', queue => {
        if (store.isLinkedDevice) {
            const remoteQueue = JSON.parse(queue)
            store.audioQueue = Object.values(remoteQueue).reduce((queued, cur) => {
                if (cur.base64) {
                    cur.dataUrl = tts.base64ToDataUrl(cur.base64)
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
function timeAgo(timestamp) {
    const millis = Date.now() - timestamp
    return prettyMilliseconds(Math.max(millis, 1000), { secondsDecimalDigits: 0 })
}
function sort(direction, url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        const search = store.clSearches.splice(index, 1).pop()
        store.clSearches.splice(direction === 'up' ? index - 1 : index, 0, search)
    }
}
function archiveHandler(url) {
    sio.emit('archive', url)
}
function searchesHandler() {
    dialogs.value.searches = true
    sio.emit('searchesList', list => {
        searches.value = list.map(item => JSON.parse(item))
    })
}
function unlinkDeviceHandler() {
    sio.emit('unlink', store.linkCode, response => {
        store.isLinkedDevice = false
        store.linkCode = undefined
    })
}
function linkDeviceHandler() {
    dialogs.value.link = true
    sio.emit('link', code => {
        if (code) {
            store.linkCode = code
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
function newSearchHandler(name = newName.value || new Date().toLocaleString(), url = newUrl.value) {
    store.clSearches.push({
        name,
        url,
        uuid: uuidv5(url, uuidv5.URL),
        tts: true
    })
    sio.emit('get', url, (payload) => {
        const { json } = payload
        data.value[json.uuid] = json
        showComments.value[json.uuid] = false
    })
    dialogs.value.searches = false
}
function deleteHandler(uuid) {
    const index = store.clSearches.findIndex(search => search.uuid === uuid)
    if (index !== -1) {
        store.clSearches.splice(index, 1)
        sio.emit('delete', uuid)
    }
}
function setSearchNameModel(uuid) {
    const index = store.clSearches.findIndex(search => search.uuid === uuid)
    if (index !== -1) {
        store.clSearches[index].name = newSearchName.value
    }
    editing.value[uuid] = false
}
function updateMostRecent(uuid) {
    const sorted = data.value[uuid]?.listings ? Object.values(data.value[uuid].listings).sort((a, b) => a.time > b.time ? -1 : 0) : []
    const update = sorted.length ? sorted.slice(0, maxListingsPerSearch) : []
    if (isMounted.value) {
        update.forEach((listing, index) => {
            const { pid, href, title } = listing
            // queue 
            if (!store.isLinkedDevice && !store.audioQueue[pid] && index < store.maxTTSPerSearch) {
                store.audioQueue[pid] = { pid, href, title, createdAt: Date.now() }
                console.log(pid, title)
                let ttsString = `${MODE === 'production' ? '' : 'development'}... ${title}`
                if (lastTTSSearch.value !== uuid) {
                    lastTTSSearch.value = uuid
                    ttsString = `search name: ${(store.clSearches.find(search => search.uuid === uuid)).name}, ${ttsString}`
                }
                if (store.clSearches.find(search => search.uuid === uuid).tts) {
                    tts.value.textToSpeech(pid, ttsString)
                }
            }
        })
    }
    console.log(update[0])
    mostRecent.value[uuid] = update
}
onMounted(() => {
    if (!store.sessionId) {
        (async () => {
            await $api.info()
            store.sessionId = cookie.parse(document.cookie)?.['connect.sid']?.match(/s:([^\.]*)/)[1]
            sio.auth = { sessionId: store.sessionId }
            sio.connect()
        })()
    } else {
        sio.auth = { sessionId: store.sessionId }
        sio.connect()
    }
    if (/#link/.test(window.location.hash) && !store.isLinkedDevice) {
        dialogs.value.linked = true
    }
    if (store.linkCode) {
        // reconnect a link on reload
        sio.emit('relink', store.linkCode, response => {
            console.log(response)
        })
    }
    sio.on('update', (payload) => {
        const { diff } = payload
        const now = Date.now()

        data.value[diff.uuid] = {
            updatedAt: now,
            listings: data.value[diff.uuid]?.listings ? {
                ...data.value[diff.uuid].listings,
                ...diff.listings
            } : diff.listings
        }
        updateMostRecent(diff.uuid)
        lastChecked.value[diff.uuid] = {
            timestamp: now,
            timeAgo: timeAgo(now)
        }
        showComments.value[diff.uuid] = false
    })
    if (!store.isLinkedDevice) {
        store.clSearches.forEach(search => {
            sio.emit('get', search.url, (payload) => {
                if (!payload) return
                const { json } = payload
                data.value[json.uuid] = json
                updateMostRecent(json.uuid)
                lastChecked.value[json.uuid] = {
                    timestamp: json.updatedAt,
                    timeAgo: timeAgo(json.updatedAt)
                }
            })
        })
    }
    setTimeout(() => {
        isMounted.value = true, 11000
    })
    interval.value = setInterval(() => {
        Object.keys(data.value)
            .filter(key => lastChecked.value[key]?.timestamp)
            .map(key => lastChecked.value[key].timeAgo = timeAgo(lastChecked.value[key].timestamp))
    }, 1000)

    function handleMessage(event) {
        if (event.origin !== 'https://giscus.app') return
        if (!(typeof event.data === 'object' && event.data.giscus)) return

        const giscusData = event.data.giscus

        if (giscusData?.discussion) {
            sio.emit('updateDiscussion', giscusData.discussion)
        }
        // Do whatever you want with it, e.g. `console.log(giscusData)`.
        // You'll need to make sure that `giscusData` contains the message you're
        // expecting, e.g. by using `if ('discussion' in giscusData)`.
    }

    window.addEventListener('message', handleMessage)
    // Some time later...
    //window.removeEventListener('message', handleMessage)

})
onBeforeUnmount(() => {
    clearInterval(interval.value)
})
watch(store.audioQueue, async queue => {
    if (debounces.value.audioQueue) clearTimeout(debounces.value.audioQueue)
    debounces.value.audioQueue = setTimeout(() => {
        if (!store.isLinkedDevice) {
            sio.emit('audioQueue', JSON.stringify(queue))
        }
    }, 1000)
}, {
    deep: true
})
</script>
