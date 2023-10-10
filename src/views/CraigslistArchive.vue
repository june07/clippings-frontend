<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <p :class="smAndDown ? 'text-h6' : 'text-h5'" class="mb-4">Clippings is an archival tool for online classified ads like Craigslist!</p>
        <p :class="smAndDown ? 'text-body-2' : 'text-body-1'">It takes a snapshot of the ad and saves it to the cloud so that it will always be available even if the original poster (or anyone else) removes it.</p>
        <p :class="smAndDown ? 'text-body-2' : 'text-body-1'">
        </p>

        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'">
            <v-card-title class="font-weight-light text-center">Archive an Ad</v-card-title>
            <v-card-subtitle class="font-weight-light text-center">Enter the link to the ad you want to archive</v-card-subtitle>
            <v-card-text>
                <v-text-field validate-on="lazy" density="compact" variant="solo" rounded="lg" v-model="store.textField" persistent-hint hint="Any Craigslist ad link" placeholder="https://sfbay.craigslist.org/sfc/zip/d/ad-to-archive" :rules="rules.url" />
                <div v-if="archiveData[listingPid] || archiveWaitingToBeReady !== undefined" class="text-center">
                    <div class="text-h6 my-4">Ad saved.</div>
                    <p class="text-start mb-4">By saving this ad you've ensured that it'll be around to reference later. The data is saved to the cloud and accessible via the links below:</p>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="2" class="text-end text-caption pb-0">web</v-col>
                        <v-col :cols="smAndDown ? 10 : 9" class="text-start pb-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://jc-archive.june07.com/craigslist/${listingPid}`" target="_blank" :loading="archiveWaitingToBeReady">
                                <div class="text-caption text-truncate">{{ `https://jc-archive.june07.com/craigslist/${listingPid}` }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ `https://jc-archive.june07.com/craigslist/${listingPid}` }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://jc-archive.june07.com/craigslist/${listingPid}`" target="_blank">
                                <div class="text-caption text-truncate" :class="archiveWaitingToBeReady ? 'text-grey-lighten-2' : 'text-green'">
                                    <v-icon icon="link" class="mr-2" />{{ `https://jc-archive.june07.com/craigslist/${listingPid}` }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="2" class="text-end text-caption py-0">git</v-col>
                        <v-col :cols="smAndDown ? 10 : 9" class="text-start py-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}`" target="_blank" :loading="archiveWaitingToBeReady">
                                <div class="text-caption text-truncate">{{ `https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}` }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ `https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}` }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :href="`https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}`" target="_blank">
                                <div class="text-caption text-truncate" :class="archiveWaitingToBeReady ? 'text-grey-lighten-2' : 'text-green'">
                                    <v-icon icon="link" class="mr-2" />{{ `https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}` }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                </div>
            </v-card-text>
            <v-card-actions class="justify-center mt-8">
                <v-btn v-if="!archiveData[listingPid]" variant="tonal" @click="archiveHandler" :loading="loading.archive" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">save forever</v-btn>
                <v-btn v-else variant="tonal" @click="resetHandler">save another</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>
<style scoped></style>
<script setup>
import { ref, onMounted, getCurrentInstance, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import cookie from 'cookie'

const { $api } = getCurrentInstance().appContext.config.globalProperties
const intervals = ref({
    default: undefined,
    checkArchiveLinkActive: undefined
})
const timeouts = ref({
    updateCommentData: undefined,
    archiveLoading: {}
})
const { smAndDown } = useDisplay()
const rules = {
    url: [
        (v) => !!v || `url is required.`,
        v => v && /https:\/\/.*\.craigslist\.org\/.+/.test(v) || /\d{10}/.test(v) || `url is not valid or not supported`
    ]
}
const { VITE_API_SERVER } = import.meta.env
const loading = ref({
    archive: false,
})
const debug = ref({})
const isMounted = ref(false)
const store = useAppStore()
const data = ref({})
const archiveWaitingToBeReady = ref()
const archiveData = ref({})
const listingPid = computed(() => pidFromUrl(store.textField) || store.textField?.match(/\d{10}/)?.[0])
const sio = io(VITE_API_SERVER + '/', {
    transports: ['websocket']
})
    .on('updatedDiscussion', discussion => {
        const { title: pid } = discussion
        Object.values(data.value).map(search => {
            Object.values(search.listings).map(listing => {
                if (listing.pid === pid) {
                    data.value[search.uuid].listings[listing.pid].commentData = discussion
                }
            })
        })
    })
    .on('screenshot', payload => {
        const { buffer, uuid } = payload
        const index = store.clSearches.findIndex(search => search.uuid === uuid)

        if (index !== -1) {
            debug.value.screenshot = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }))
        }
    })
    .on('connect_error', (error) => {
        console.log('CALLBACK ERROR: ' + error)
    })
    .on('error', reason => {
        console.log(reason)
    })
const pidFromUrl = (url) => url && url.match(/\/([^\/]*)\.html/)?.[1]
function archiveHandler() {
    if (!listingPid.value || !/https:\/\/.*\.craigslist\.org\/.+/.test(store.textField)) return
    loading.value.archive = true
    sio.emit('archive', store.textField)
    if (timeouts.value.archiveLoading[listingPid.value]) clearInterval(timeouts.value.archiveLoading[listingPid.value])
    timeouts.value.archiveLoading[listingPid.value] = setTimeout(() => loading.value.archive = false, 30000)
}
function resetHandler() {
    reset()
}
function reset() {
    archiveWaitingToBeReady.value = undefined
    store.textField = undefined
}
watch(() => store.textField, (newValue, oldValue) => {
    if (!newValue || newValue === oldValue || !newValue.match(/\d{10}/)?.[0]) return
    sio.emit('getArchive', listingPid.value, archive => {
        archiveData.value[listingPid.value] = JSON.parse(archive)
    })
})
onMounted(() => {
    if (/\/share/.test(document.location.pathname)) {
        const url = new URLSearchParams(document.location.search).get('url')
        const title = new URLSearchParams(document.location.search).get('title')
        if (/https:\/\/.*\.craigslist\.org\/.+/.test(url)) {
            store.textField = url
        }
    }
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
    sio.on('connect', () => {
        if (/#share/.test(document.location.hash) && store.textField) {
            archiveHandler()
        } else if (listingPid.value) {
            sio.emit('getArchive', listingPid.value, archive => {
                archiveData.value[listingPid.value] = JSON.parse(archive)
            })
        }
    })
        .on('update', (payload) => {
            const { archived } = payload
            const { gitUrl } = archived

            loading.value.archive = false
            archiveWaitingToBeReady.value = true

            intervals.value.checkArchiveLinkActive = setInterval(async () => {
                try {
                    const response = await fetch(gitUrl)
                    if (response.status == 200) {
                        clearInterval(intervals.value.checkArchiveLinkActive)
                        archiveWaitingToBeReady.value = false
                    }
                } catch (error) {
                    error
                }
            }, 10000)
            setTimeout(() => {
                clearInterval(intervals.value.checkArchiveLinkActive)
            }, 300000)
        })
    setTimeout(() => {
        isMounted.value = true, 11000
    })
    function handleMessage(event) {
        if (event.origin !== 'https://giscus.app') return
        if (!(typeof event.data === 'object' && event.data.giscus)) return

        const giscusData = event.data.giscus

        if (giscusData?.discussion) {
            if (timeouts.value.updateCommentData) clearTimeout(timeouts.value.updateCommentData)
            timeouts.value.updateCommentData = setTimeout(() => sio.emit('updateDiscussion', giscusData.discussion), 500)
        }
        // Do whatever you want with it, e.g. `console.log(giscusData)`.
        // You'll need to make sure that `giscusData` contains the message you're
        // expecting, e.g. by using `if ('discussion' in giscusData)`.
    }

    window.addEventListener('message', handleMessage)
    // Some time later...
    //window.removeEventListener('message', handleMessage)

})
</script>
