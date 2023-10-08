<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <v-card rounded="xl" class="pa-4" style="opacity: 0.96" width="800px">
            <v-card-title class="font-weight-light text-center">Archive an Ad</v-card-title>
            <v-card-subtitle class="font-weight-light text-center">Enter the link to the ad you want to archive</v-card-subtitle>
            <v-card-text>
                <v-text-field density="compact" variant="solo" rounded="lg" v-model="textField" persistent-hint hint="Any Craigslist ad link" placeholder="https://sfbay.craigslist.org/sfc/zip/d/ad-to-archive" :rules="rules.url" />
                <div v-if="archiveData[listingPid] || archiveWaitingToBeReady !== undefined" class="text-center">
                    <div class="text-h6 mb-4">Ad successfully archived.</div>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="1" class="text-end text-caption pb-0">http</v-col>
                        <v-col cols="9" class="text-start pb-0">
                            <v-btn variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'white' : 'green'" :href="`https://jc-archive.june07.com/craigslist/${listingPid}`" target="_blank" class="text-caption">{{ `https://jc-archive.june07.com/craigslist/${listingPid}` }}</v-btn>
                        </v-col>
                        <v-spacer />
                    </v-row>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="1" class="text-end text-caption py-0">git</v-col>
                        <v-col cols="9" class="text-start py-0">
                            <v-btn variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'white' : 'green'" :href="`https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}`" target="_blank" class="text-caption">{{ `https://github.com/june07/jc-archive/tree/main/craigslist/${listingPid}` }}</v-btn>
                        </v-col>
                        <v-spacer />
                    </v-row>
                </div>
            </v-card-text>
            <v-card-actions class="justify-center">
                <v-btn prepend-icon="unarchive" variant="tonal" @click="archiveHandler(textField)" :loading="textField && loading.archive[listingPid]" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">archive</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>
<style scoped>
</style>
<script setup>
import { ref, onMounted, getCurrentInstance, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import prettyMilliseconds from 'pretty-ms'
import cookie from 'cookie'

const { $api } = getCurrentInstance().appContext.config.globalProperties
const intervals = ref({
    default: undefined,
    checkArchiveLinkActive: {}
})
const timeouts = ref({
    updateCommentData: undefined,
    archiveLoading: {}
})
const { MODE } = import.meta.env
const { smAndDown } = useDisplay()
const rules = {
    url: [
        (v) => !!v || `url is required.`,
        v => v && /https:\/\/.*\.craigslist\.org\/.+/.test(v) || /\d{10}/.test(v) || `url is not valid or not supported`
    ]
}
const { VITE_API_SERVER } = import.meta.env
const loading = ref({
    archive: {}
})
const debug = ref({})
const isMounted = ref(false)
const store = useAppStore()
const data = ref({})
const archiveWaitingToBeReady = ref()
const textField = ref()
const archiveData = ref({})
const listingPid = computed(() => pidFromUrl(textField.value) || textField.value?.match(/\d{10}/)?.[0])
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
function timeAgo(timestamp) {
    const millis = Date.now() - timestamp
    return prettyMilliseconds(Math.max(millis, 1000), { secondsDecimalDigits: 0 })
}
const pidFromUrl = (url) => url && url.match(/\/([^\/]*)\.html/)?.[1]
function archiveHandler() {
    if (!listingPid.value || !/https:\/\/.*\.craigslist\.org\/.+/.test(textField.value)) return
    loading.value.archive[listingPid.value] = true
    sio.emit('archive', textField.value)
    if (timeouts.value.archiveLoading[listingPid.value]) clearInterval(timeouts.value.archiveLoading[listingPid.value])
    timeouts.value.archiveLoading[listingPid.value] = setTimeout(() => loading.value.archive[listingPid.value] = false, 30000)
}
watch(textField, (newValue, oldValue) => {
    if (!newValue || newValue === oldValue || !newValue.match(/\d{10}/)?.[0]) return
    sio.emit('getArchive', listingPid.value, archive => {
        archiveData.value[listingPid.value] = JSON.parse(archive)
    })
})
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
    sio.on('update', (payload) => {
        const { archived } = payload
        const { pid, gitUrl } = archived

        loading.value.archive[pid] = false
        archiveWaitingToBeReady.value = true
        Object.values(data.value).map(search => {
            const listingKV = Object.entries(search.listings).find(kv => kv[1].pid === pid)
            if (listingKV) {
                data.value[search.uuid].listings[listingKV[0]].gitUrl = gitUrl
                intervals.value.checkArchiveLinkActive[search.uuid] = setInterval(async () => {
                    try {
                        const response = await fetch(gitUrl)
                        if (response.status == 200) {
                            clearInterval(intervals.value.checkArchiveLinkActive[search.uuid])
                            archiveWaitingToBeReady.value = false
                        }
                    } catch (error) {
                        error
                    }
                }, 10000)
                setTimeout(() => {
                    clearInterval(intervals.value.checkArchiveLinkActive[search.uuid])
                }, 300000)
            }
        })
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
