<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <div class="d-flex align-center" :style="smAndDown ? 'width: -webkit-fill-available' : 'width: 800px'">
            <div class="d-flex align-center justify-start">
                <icon-base><icon-logo iconColor="white" /></icon-base>
                <span v-if="!smAndDown"><span class="font-weight-bold ml-2 mr-1">Clippings</span><span class="mr-2 font-weight-thin font-italic">by June07</span></span>
                <v-btn variant="text" size="small" prepend-icon="home" href="/home" v-if="location.pathname !== '/home'">home</v-btn>
            </div>
            <v-spacer />
            <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="email" :icon="smAndDown ? 'email' : undefined" href="mailto://support@june07.com" text="email" />
            <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="web" :icon="smAndDown ? 'web' : undefined" href="https://june07.com" text="blog" />
            <social-share size="small" :density="smAndDown ? 'compact' : 'default'" :icon="smAndDown ? 'share' : undefined" />
            <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="help" :icon="smAndDown ? 'help' : undefined" href="https://blog.june07.com/clippings-frequently-asked-questions/" text="faq" />
            <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="toll" :icon="smAndDown ? 'toll' : undefined" href="https://blog.june07.com/donate" text="donate" />
        </div>
        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="location.pathname === '/home'">
            <p :class="smAndDown ? 'text-h5' : 'text-h4'" class="mb-8"><span class="font-weight-bold">Clippings</span><span class="font-italic"> is your modern-day archival tool for online classified ads...</span> like Craigslist!</p>
            <p :class="smAndDown ? 'text-body-2' : 'text-body-1'">Clippings is your modern-day archival tool for online classified ads, reminiscent of the days when we used to clip newspaper ads. It captures and securely stores ad snapshots in the cloud, ensuring they're always accessible—even if the original poster or anyone else removes them.</p>
            <div class="d-flex justify-center">
                <ul class="mt-4 font-weight-bold text-body-2">
                    <li>Ads archived to robust/permanent cloud location (<a href="https://github.com/" rel="noopener" target="_blank">GitHub</a>)</li>
                    <li>No fussing with screenshots or storing files on your own device</li>
                    <li>100% open source (Vue.js <a href="https://github.com/june07/clippings-frontend" rel="noopener" target="_blank">frontend</a>,
                        Node.js <a href="https://github.com/june07/clippings-backend" rel="noopener" target="_blank">backend</a>,
                        <a href="https://github.com/june07/clippings-archive" rel="noopener" target="_blank">archive</a>)
                    </li>
                </ul>
            </div>
            <p :class="smAndDown ? 'text-body-2' : 'text-body-1'" class="mb-8">
            </p>
        </v-card>
        <v-spacer />
        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="mostRecentListings?.length">
            <v-card-title class="font-weight-light text-center">Most recently archived ads</v-card-title>
            <v-card-text class="font-weight-light">
                <div class="d-flex align-center" v-for="mostRecentListing of mostRecentListings">
                    <social-share size="small" density="compact" icon="share" :url="`https://clippings-archive.june07.com/craigslist/${mostRecentListing.listingPid}`" color="amber-lighten-2" />
                    <a style="text-decoration: none" :href="`https://clippings-archive.june07.com/craigslist/${mostRecentListing.listingPid}`" target="_blank" class="ml-1">
                        <div class="text-caption text-truncate">
                            <v-icon icon="link" class="mr-2" />{{ mostRecentListing.metadata?.title }}
                        </div>
                    </a>
                </div>
            </v-card-text>
        </v-card>
        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'" :elevation="loading.archive ? 0 : undefined">
            <v-card-title class="font-weight-light text-center">{{ loading.archive ? 'Archiving' : 'Archive an' }} Ad</v-card-title>
            <v-card-subtitle v-if="!loading.archive" class="font-weight-light text-center">Enter the link to the ad you want to archive</v-card-subtitle>
            <v-card-subtitle v-else class="font-weight-light text-center font-caption text-wrap">{{ smAndDown ? shortenAdURL(store.textField) : store.textField }}</v-card-subtitle>
            <v-card-text v-show="!loading.archive" class="pa-0">
                <v-text-field validate-on="lazy" density="compact" variant="solo" roundesd="lg" v-model="store.textField" persistent-hint hint="Any Craigslist ad link" placeholder="https://sfbay.craigslist.org/sfc/zip/d/ad-to-archive" :rules="rules.url" />
                <div v-if="archiveData[listingPid] || archiveWaitingToBeReady !== undefined" class="text-center">
                    <div class="text-h6 my-4">📰 Ad saved. 🗞️</div>
                    <p class="text-start mb-4">The data is saved to the cloud and will be accessible via the links below once they turn green:</p>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="2" class="text-end text-caption pb-0">web</v-col>
                        <v-col :cols="smAndDown ? 10 : 9" class="text-start pb-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://clippings-archive.june07.com/craigslist/${listingPid}`" target="_blank" :loading="archiveWaitingToBeReady">
                                <div class="text-caption text-truncate">{{ `https://clippings-archive.june07.com/craigslist/${listingPid}` }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular color="amber" size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ `https://clippings-archive.june07.com/craigslist/${listingPid}` }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://clippings-archive.june07.com/craigslist/${listingPid}`" target="_blank">
                                <div class="text-caption text-truncate" :class="archiveWaitingToBeReady ? 'text-grey-lighten-2' : 'text-green'">
                                    <v-icon icon="link" class="mr-2" />{{ `https://clippings-archive.june07.com/craigslist/${listingPid}` }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col cols="2" class="text-end text-caption py-0">git</v-col>
                        <v-col :cols="smAndDown ? 10 : 9" class="text-start py-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="`https://github.com/june07/clippings-archive/tree/main/craigslist/${listingPid}`" target="_blank" :loading="archiveWaitingToBeReady">
                                <div class="text-caption text-truncate">{{ `https://github.com/june07/clippings-archive/tree/main/craigslist/${listingPid}` }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular color="amber" size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ `https://github.com/june07/clippings-archive/tree/main/craigslist/${listingPid}` }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :href="`https://github.com/june07/clippings-archive/tree/main/craigslist/${listingPid}`" target="_blank">
                                <div class="text-caption text-truncate" :class="archiveWaitingToBeReady ? 'text-grey-lighten-2' : 'text-green'">
                                    <v-icon icon="link" class="mr-2" />{{ `https://github.com/june07/clippings-archive/tree/main/craigslist/${listingPid}` }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                </div>
            </v-card-text>
            <v-card-actions class="justify-center mt-8">
                <v-progress-circular v-if="loading.archive" indeterminate :size="200" width="1" color="amber">
                    <v-btn v-if="!archiveData[listingPid]" :variant="loading.archive ? 'plain' : 'tonal'" @click="archiveHandler" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">
                        <div class="text-weight-light" :class="loading.archive ? 'animate__animated animate__pulse animate__infinite' : ''">{{ loading.archive ? 'saving' : 'save' }}</div>
                    </v-btn>
                    <v-btn v-else variant="tonal" @click="resetHandler">save another</v-btn>
                </v-progress-circular>
                <div v-else>
                    <v-btn v-if="!archiveData[listingPid]" variant="tonal" rounded @click="archiveHandler" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">
                        <div class="text-weight-light" :class="loading.archive ? 'animate__animated animate__pulse animate__infinite' : ''">{{ loading.archive ? 'saving' : 'save' }}</div>
                    </v-btn>
                    <v-btn v-else variant="tonal" @click="resetHandler">save another</v-btn>
                </div>
            </v-card-actions>
        </v-card>
        <v-card rounded="xl" class="pa-4 mt-2" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="mostRecentDiscussions?.length">
            <v-card-title class="font-weight-light text-center">Most recent comments</v-card-title>
            <v-card-text class="font-weight-light">
                <div class="d-flex align-center justify-center" v-for="mostRecentDiscussion of mostRecentDiscussions">
                    <v-tooltip>
                        <template v-slot:activator="{ props }">
                            <a v-bind="props" style="text-decoration: none" :href="`https://clippings-archive.june07.com/craigslist/${mostRecentDiscussion.title}`">
                                {{ mostRecentDiscussion.comments.nodes[0].body }}
                            </a>
                        </template>
                        <div>{{ humanizeDuration(Date.now() - Date.parse(mostRecentDiscussion.createdAt), { units: ['h', 'm'], round: true }) }} ago</div>
                    </v-tooltip>
                </div>
            </v-card-text>
        </v-card>
        <v-spacer />
    </v-container>
</template>
<style scoped>
</style>
<script setup>
import { ref, onMounted, getCurrentInstance, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import cookie from 'cookie'
import 'animate.css'
import humanizeDuration from 'humanize-duration'

import IconBase from '@/components/IconBase.vue'
import IconLogo from '@/components/IconLogo.vue'
import SocialShare from '@/components/SocialShare.vue'

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
const mostRecentListings = ref([])
const mostRecentDiscussions = ref([])
const location = ref({})
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
const shortenAdURL = (url) => url && url.match(/https?:\/\/[^/]*(.*)/)?.[1] ? `...${url.match(/https?:\/\/[^/]*(.*)/)[1]}` : ''
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
    location.value = document.location
    if (!store.splashed) {
        store.splashed = new Date()
        window.location.pathname = '/home'
    }
    if (/\/share/.test(document.location.pathname)) {
        const url = new URLSearchParams(document.location.search).get('url') || new URLSearchParams(document.location.search).get('text')
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
        if (/\/share/.test(document.location.pathname) && store.textField) {
            archiveHandler()
        } else if (listingPid.value) {
            sio.emit('getArchive', listingPid.value, archive => {
                archiveData.value[listingPid.value] = JSON.parse(archive)
            })
        }
        sio.emit('getMostRecentDiscussions', { last: 10 })
        sio.emit('getMostRecentListings', payload => {
            mostRecentListings.value = payload.map(mostRecentListing => JSON.parse(mostRecentListing))
                .sort((listingA, listingB) => (listingA.createdAt || Date.now()) > (listingB.createdAt || Date.now()) ? 0 : -1)
        })
    })
        .on('mostRecentListings', payload => {
            mostRecentListings.value = payload.map(mostRecentListing => JSON.parse(mostRecentListing))
                .sort((listingA, listingB) => (listingA.createdAt || Date.now()) > (listingB.createdAt || Date.now()) ? 0 : -1)
        })
        .on('mostRecentDiscussions', payload => {
            mostRecentDiscussions.value = payload
        })
        .on('update', payload => {
            const { archived } = payload
            const { gitUrl, listingPid } = archived

            archiveData.value[listingPid] = archived
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
