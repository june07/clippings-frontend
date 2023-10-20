<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <nav-header @changeTheme="$emit('changeTheme')" v-model="location" />
        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="location.pathname === '/home'">
            <p :class="smAndDown ? 'text-h5' : 'text-h4'" class="mb-8"><span class="font-weight-bold">Clippings</span><span class="font-italic"> is your modern-day archival tool for online classified ads...</span> like Craigslist!</p>
            <p :class="smAndDown ? 'text-body-2' : 'text-body-1'">Clippings is your modern-day archival tool for online classified ads, reminiscent of the days when we used to clip newspaper ads. It captures and securely stores ad snapshots in the cloud, ensuring they're always accessible—even if the original poster or anyone else removes them.</p>
            <div class="d-flex justify-center">
                <ul class="mt-4 font-weight-bold text-body-2">
                    <li>Ads archived to robust/permanent cloud location (<a href="https://github.com/" rel="noopener" target="_blank">GitHub</a>)</li>
                    <li>No fussing with screenshots or storing files on your own device</li>
                    <li>100% open source (Vue.js <a href="https://github.com/june07/clippings-frontend" rel="noopener" target="_blank">frontend</a>,
                        Node.js <a href="https://github.com/june07/clippings-backend" rel="noopener" target="_blank">backend</a>,
                        and <a href="https://github.com/june07/clippings-archive" rel="noopener" target="_blank">archive</a>)
                    </li>
                    <li>Read more about Clippings on <a href="https://news.ycombinator.com/item?id=37860172" rel="noopener" target="_blank">Hacker News</a></li>
                </ul>
            </div>
            <v-banner v-if="!store.banners.share.disabled" :lines="smAndDown ? 'three' : 'two'" color="info" icon="info" class="mt-4 mx-auto" :class="smAndDown ? 'pa-4' : 'px-4'" elevation="12" rounded="xl" :max-width="smAndDown ? undefined : '70%'">
                <template v-slot:prepend>
                    <social-share v-if="smAndDown" size="50" :density="smAndDown ? 'compact' : 'default'" :icon="smAndDown ? 'share' : undefined" :url="location.href" color="amber" />
                    <v-icon v-else icon="info" color="info" size="50" />
                </template>
                <template v-slot:text>
                    <span :class="smAndDown ? 'text-body-2' : ''">🚀 Help Us Grow! Please Share Clippings with Your Social Network 🌟</span>
                    <social-share v-if="!smAndDown" size="small" :density="smAndDown ? 'compact' : 'default'" :icon="smAndDown ? 'share' : undefined" :url="location.href" color="amber" />
                </template>

                <template v-slot:actions v-if="!smAndDown">
                    <v-btn @click="store.banners.share.disabled = true" icon="close" size="x-small" />
                </template>
            </v-banner>
            <p :class="smAndDown ? 'text-body-2' : 'text-body-1'" class="mb-8">
            </p>
        </v-card>
        <v-spacer />
        <v-card rounded="xl" class="pa-4" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="mostRecentListings?.length" :class="smAndDown ? 'pl-0' : ''">
            <v-card-title class="font-weight-light text-center">Most recently archived ads 🆕</v-card-title>
            <v-card-text class="font-weight-light" :class="smAndDown ? 'pl-0' : ''">
                <v-sheet rounded="xl" class="pa-4" :class="smAndDown ? 'pl-0' : ''">
                    <div class="d-flex align-center" v-for="mostRecentListing of mostRecentListings">
                        <social-share size="small" density="compact" :icon="smAndDown ? 'share' : undefined" :url="getWebURL(mostRecentListing.listingPid)" color="amber-lighten-2" :text="smAndDown ? undefined : 'share'" />

                        <v-btn variant="plain" size="small" density="compact" color="orange" :href="getCodeURL(mostRecentListing.listingPid)" target="_blank" class="pl-0" :prepend-icon="smAndDown ? undefined : 'code'" :icon="smAndDown ? 'code' : undefined" :text="smAndDown ? undefined : 'git'" />

                        <v-btn variant="plain" size="small" density="compact" color="blue" :href="getArchiveURL(mostRecentListing.listingPid)" target="_blank" class="pl-0" :prepend-icon="smAndDown ? undefined : 'link'" :icon="smAndDown ? 'link' : undefined" :text="smAndDown ? undefined : 'static'" />

                        <a style="text-decoration: none" :href="getWebURL(mostRecentListing.listingPid)" class="pl-0">
                            <div class="text-caption text-truncate">
                                <v-icon icon="web" class="mr-2" color="green" />{{ mostRecentListing.metadata?.title }}
                            </div>
                        </a>
                    </div>
                </v-sheet>
            </v-card-text>
        </v-card>
        <v-card rounded="xl" class="pa-4 mt-2" :width="smAndDown ? '-webkit-fill-available' : '800px'" :elevation="loading.archive ? 0 : 2">
            <v-card-title class="font-weight-light text-center">{{ loading.archive ? 'Archiving' : 'Archive an' }} ad ✂️</v-card-title>
            <v-card-subtitle v-if="!loading.archive" class="font-weight-light text-center">Enter the link to the ad you want to archive</v-card-subtitle>
            <v-card-subtitle v-else class="font-weight-light text-center font-caption text-wrap">{{ smAndDown ? shortenAdURL(store.textField) : store.textField }}</v-card-subtitle>
            <v-card-text v-show="!loading.archive" class="pa-0 mt-8">
                <v-text-field validate-on="lazy" density="compact" variant="outlined" rounded="lg" v-model="store.textField" persistent-hint hint="Any Craigslist ad link" placeholder="https://sfbay.craigslist.org/sfc/zip/d/ad-to-archive" :rules="rules.url">
                    <template v-slot:details>
                        <v-checkbox density="compact" hide-details class="d-flex justify-end" v-model="alertCheckbox">
                            <template v-slot:prepend>
                                <v-btn variant="text" density="compact" icon="emergency_share" :color="alertCheckbox ? 'red-accent-4' : ''" @click="emergencySetupDialogHandler" />
                            </template>
                        </v-checkbox>
                    </template>
                </v-text-field>
                <div v-if="archiveData[listingPid] || archiveWaitingToBeReady !== undefined" class="text-center">
                    <div class="text-h6 my-4">📰 Ad saved. 🗞️</div>
                    <p class="text-start mb-4">The data is saved to the cloud and will be accessible via the links below once they turn green:</p>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col :cols="3" class="d-flex justify-end text-caption py-0">
                            <v-icon icon="language" color="amber" class="mr-1" />
                            <div class="text-end" style="width: 30px">web</div>
                        </v-col>
                        <v-col :cols="9" class="text-start py-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" color="green" :href="getWebURL(listingPid)">
                                <div class="text-caption text-truncate">{{ getWebURL(listingPid) }}</div>
                            </v-btn>
                            <a v-else style="text-decoration: none" :href="getWebURL(listingPid)">
                                <div class="text-caption text-truncate text-green">
                                    <v-icon icon="link" class="mr-2" />{{ getWebURL(listingPid) }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col :cols="3" class="d-flex justify-end text-caption py-0">
                            <v-icon icon="language" color="blue" class="mr-1" />
                            <div class="text-end" style="width: 30px" v-if="!smAndDown || (smAndDown && !archiveWaitingToBeReady)">web</div>
                            <v-progress-circular class="justify-self-end" style="width: 30px" v-else-if="smAndDown && archiveWaitingToBeReady" color="amber" size="x-small" width="1" indeterminate />
                        </v-col>
                        <v-col :cols="9" class="text-start py-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="getArchiveURL(listingPid)" target="_blank" :loading="archiveWaitingToBeReady">
                                <div class="text-caption text-truncate">{{ getArchiveURL(listingPid) }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular color="amber" size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ getArchiveURL(listingPid) }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :color="archiveWaitingToBeReady ? 'grey-lighten-2' : 'green'" :href="getArchiveURL(listingPid)" target="_blank">
                                <div class="text-caption text-truncate" :class="archiveWaitingToBeReady ? 'text-grey-lighten-2' : 'text-green'">
                                    <v-icon icon="link" class="mr-2" />{{ getArchiveURL(listingPid) }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                    <v-row class="d-flex align-center">
                        <v-spacer />
                        <v-col :cols="3" class="d-flex justify-end text-caption py-0">
                            <v-icon icon="code" color="orange" class="mr-1" />
                            <div class="text-end" style="width: 30px">git</div>
                        </v-col>
                        <v-col :cols="9" class="text-start py-0 pl-0">
                            <v-btn v-if="!smAndDown" density="compact" variant="text" prepend-icon="link" color="green" :href="getCodeURL(listingPid)" target="_blank">
                                <div class="text-caption text-truncate">{{ getCodeURL(listingPid) }}</div>
                                <template v-slot:loader>
                                    <v-progress-circular color="amber" size="x-small" width="1" class="mr-2" indeterminate />
                                    <div class="text-caption text-truncate">{{ getCodeURL(listingPid) }}</div>
                                </template>
                            </v-btn>
                            <a v-else style="text-decoration: none" :href="getCodeURL(listingPid)" target="_blank">
                                <div class="text-caption text-truncate text-green">
                                    <v-icon icon="link" class="mr-2" />{{ getCodeURL(listingPid) }}
                                </div>
                            </a>
                        </v-col>
                        <v-spacer />
                    </v-row>
                </div>
            </v-card-text>
            <v-card-actions class="d-flex flex-column justify-center mt-8">
                <v-progress-circular v-if="loading.archive" indeterminate :size="200" width="1" color="amber">
                    <v-btn v-if="!archiveData[listingPid]" :variant="loading.archive ? 'plain' : 'tonal'" @click="archiveHandler" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">
                        <div class="text-weight-light" :class="loading.archive ? 'animate__animated animate__pulse animate__infinite' : ''">{{ loading.archive ? 'saving' : 'save' }}</div>
                    </v-btn>
                    <v-btn v-else variant="tonal" @click="resetHandler">save another</v-btn>
                </v-progress-circular>
                <div v-else :class="!store.subscribed.daily ? 'mb-8' : ''">
                    <v-btn v-if="!archiveData[listingPid]" variant="tonal" rounded @click="archiveHandler" :disabled="archiveData[listingPid] || archiveWaitingToBeReady !== undefined ? true : false">
                        <div class="text-weight-light" :class="loading.archive ? 'animate__animated animate__pulse animate__infinite' : ''">{{ loading.archive ? 'saving' : 'save' }}</div>
                    </v-btn>
                    <v-btn v-else variant="tonal" @click="resetHandler">save another</v-btn>
                </div>
                <email-signup type="daily" @signup="emailSignupHandler" :subscribed="subscribed" />
            </v-card-actions>
        </v-card>
        <v-card rounded="xl" class="pa-4 mt-2" :width="smAndDown ? '-webkit-fill-available' : '800px'" elevation="0" v-if="mostRecentDiscussions?.length">
            <v-card-title class="font-weight-light text-center text-amber">Most recent ad comments 💬</v-card-title>
            <v-card-text class="font-weight-light">
                <v-list lines="two">
                    <v-sheet rounded="xl" :color="store.theme === 'light' ? 'amber-lighten-5' : 'amber-lighten-1'" class="py-2">
                        <v-list-item density="compact" v-for="mostRecentDiscussion of mostRecentDiscussions" :prepend-avatar="mostRecentDiscussion.comments.nodes?.[0]?.author?.avatarUrl">
                            <template v-slot:title>
                                <v-tooltip>
                                    <template v-slot:activator="{ props }">
                                        <a v-bind="props" style="text-decoration: none" :href="getWebURL(mostRecentDiscussion.title)">
                                            {{ mostRecentDiscussion.comments.nodes[0]?.body }}
                                        </a>
                                    </template>
                                    <div>{{ humanizeDuration(Date.now() - Date.parse(mostRecentDiscussion.createdAt), { units: ['h', 'm'], round: true }) }} ago</div>
                                </v-tooltip>
                            </template>
                            <template v-slot:subtitle>
                                <span class="text-caption">{{ mostRecentDiscussion.url }}</span>
                            </template>
                        </v-list-item>
                    </v-sheet>
                </v-list>
            </v-card-text>
        </v-card>
        <v-spacer />
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialogs.subscribed" @update:modelValue="store.confirmed = Date.now()">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Subscribed to Clippings Chronicles</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Thank you for confirming!</v-card-subtitle>
                <v-card-text class="text-body-1">
                    We're excited to have you on board. Look forward to receiving our latest updates and offers in your inbox soon!
                </v-card-text>
            </v-card>
        </v-dialog>
        <emergency-setup-dialog v-model="dialogs.emergencySetup" @close="dialogs.emergencySetup = false"
            @create:contact="createContact => emergencySetupHandler({ createContact })"
            @update:contact="updateContact => emergencySetupHandler({ updateContact })"
            @delete:contact="deleteContact => emergencySetupHandler({ deleteContact })"
            @create:message="createMessage => emergencySetupHandler({ createMessage })"
            @update:message="updateMessage => emergencySetupHandler({ updateMessage })"
            @delete:message="deleteMessage => emergencySetupHandler({ deleteMessage })"
            @delete:alert="deleteAlert => emergencySetupHandler({ deleteAlert })"
            :updatedMessage="updated.message"
            :updatedContact="updated.contact"
            :updatedAlert="updated.alert" />
        <emergency-alert-dialog v-model="dialogs.emergencyAlert" @close="dialogs.emergencyAlert = false" :listingPid="listingPid" :adURL="store.textField" @create:alert="alertHandler" :created="created.alert" />
    </v-container>
</template>
<style scoped>
:deep() .v-text-field .v-field--no-label input,
.v-text-field .v-field--active input {
    padding: 0 8px 0 8px;
}

:deep() .v-text-field .v-input__details {
    padding: 0;
    align-items: flex-start;
}

:deep() .v-banner-text {
    padding-right: 0 !important;
    margin-top: auto;
    margin-bottom: auto;
}

:deep() .v-messages {
    margin: auto;
}

:deep() .v-banner__prepend {
    margin-right: 0;
    margin-top: auto;
    margin-bottom: auto;
}

:deep() .v-text-field .v-input__prepend {
    margin-right: 0;
}
</style>
<script setup>
import { ref, onMounted, getCurrentInstance, computed, watch, inject } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import cookie from 'cookie'
import 'animate.css'
import humanizeDuration from 'humanize-duration'

import SocialShare from '@/components/SocialShare.vue'
import EmailSignup from '@/components/EmailSignup.vue'
import NavHeader from '@/components/NavHeader.vue'
import EmergencySetupDialog from '@/components/EmergencySetupDialog.vue'
import EmergencyAlertDialog from '@/components/EmergencyAlertDialog.vue'

const emit = defineEmits(['error'])
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
const dialogs = ref({
    subscribed: false,
    emergencySetup: false,
    emergencyAlert: false
})
const subscribed = ref(false)
const mostRecentListings = ref([])
const mostRecentDiscussions = ref([])
const location = ref({})
const debug = ref({})
const isMounted = ref(false)
const store = useAppStore()
const data = ref({})
const archiveWaitingToBeReady = ref()
const archiveData = ref({})
const listingPid = computed(() => pidFromURL(store.textField) || store.textField?.match(/\d{10}/)?.[0])
const alertCheckbox = ref(store.settings.alertCheckbox)
const created = ref({
    alert: false,
    contact: false,
    message: false
})
const updated = ref({
    alert: false,
    contact: false,
    message: false
})
const deleted = ref({
    alert: false,
    contact: false,
    message: false
})
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
        if (/no matching session/.test(error.message)) {
            emit('error', error.message)
        } else {
            console.log('CALLBACK ERROR: ' + error)
        }
    })
    .on('error', reason => {
        console.log(reason)
    })
const pidFromURL = inject('pidFromURL')
const shortenAdURL = inject('shortenAdURL')
const getCodeURL = inject('getCodeURL')
const getWebURL = inject('getWebURL')
const getArchiveURL = inject('getArchiveURL')
async function emergencyAlertHandler() {
    if (!store.settings.emergencyContact.contacts.length) {
        dialogs.value.emergencySetup = true
        return
    }
    if (store.settings.emergencyContact.contacts.updated > Date.now() - 3_600_000) {
        sio.emit('getEmergencyContacts', contacts => {
            store.settings.emergencyContact.contacts = contacts
        })
    }
    if (store.settings.emergencyContact.messages.updated > Date.now() - 3_600_000) {
        sio.emit('getEmergencyMessages', messages => {
            store.settings.emergencyContact.messages = messages
        })
    }
    dialogs.value.emergencyAlert = true
}
function emergencySetupHandler(event) {
    sio.emit(Object.keys(event)[0], Object.values(event)[0])
}
function emergencySetupDialogHandler() {
    sio.emit('readAlerts', {}, alerts => store.alerts.emergency = alerts)
    dialogs.value.emergencySetup = !dialogs.value.emergencySetup
}
function archiveHandler() {
    if (!listingPid.value || !/https:\/\/.*\.craigslist\.org\/.+/.test(store.textField)) return
    loading.value.archive = true
    sio.emit('archive', store.textField)
    if (alertCheckbox.value) {
        emergencyAlertHandler()
    }
    if (timeouts.value.archiveLoading[listingPid.value]) clearInterval(timeouts.value.archiveLoading[listingPid.value])
    timeouts.value.archiveLoading[listingPid.value] = setTimeout(() => loading.value.archive = false, 30000)
}
function emailSignupHandler() {
    sio.emit('subscribe-daily', store.textFieldEmail, result => {
        if (result instanceof Error) {
            console.error(result)
        } else {
            subscribed.value = true
        }
    })
}
function resetHandler() {
    reset()
}
function reset() {
    archiveWaitingToBeReady.value = undefined
    store.textField = undefined
}
function alertHandler(params) {
    const alert = {
        listingPid: listingPid.value,
        ...params
    }
    sio.emit('createAlert', alert)
}
watch(() => store.textField, (newValue, oldValue) => {
    if (!newValue || newValue === oldValue || !newValue.match(/\d{10}/)?.[0]) return
    sio.emit('getArchive', listingPid.value, archive => {
        archiveData.value[listingPid.value] = JSON.parse(archive)
    })
})
onMounted(() => {
    if (!store.splashed) {
        store.splashed = new Date()
        location.value.pathname = '/home'
    }
    if (!store.confirmed && location.value.pathname === '/thanks') {
        dialogs.value.subscribed = true
    }
    if (/\/share/.test(location.value.pathname)) {
        const url = new URLSearchParams(location.value.search).get('url') || new URLSearchParams(location.value.search).get('text')
        const title = new URLSearchParams(location.value.search).get('title')
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
        if (/\/share/.test(location.value.pathname) && store.textField) {
            archiveHandler()
        } else if (listingPid.value) {
            sio.emit('getArchive', listingPid.value, archive => {
                archiveData.value[listingPid.value] = JSON.parse(archive)
            })
        }
        sio.emit('getMostRecentDiscussions', { last: 10 })
        sio.emit('getMostRecentListings', payload => {
            if (!payload?.length) return
            mostRecentListings.value = payload.map(mostRecentListing => JSON.parse(mostRecentListing))
                .sort((listingA, listingB) => (listingA.createdAt || 264330300000) > (listingB.createdAt || 264330300000) ? -1 : 0)
        })
    }).on('contactCreated', payload => {
        store.settings.emergencyContact.contacts.push(payload)
        created.value.contact = true
        setTimeout(() => created.value.contact = false)
    }).on('contactUpdated', payload => {
        const index = store.settings.emergencyContact?.contacts?.findIndex(contact => contact._id === payload._id)

        if (index !== -1) {
            store.settings.emergencyContact.contacts[index] = payload
        } else {
            store.settings.emergencyContact.contacts.push(payload)
        }
        updated.value.contact = true
        setTimeout(() => updated.value.contact = false)
    }).on('contactDeleted', payload => {
        const index = store.settings.emergencyContact?.contacts?.findIndex(contact => contact._id === payload._id)
        if (index !== -1) {
            store.settings.emergencyContact.contacts.splice(index, 1)
        }
        deleted.value.contact = true
        setTimeout(() => deleted.value.contact = false)
    }).on('messageCreated', payload => {
        store.settings.emergencyContact.messages.push(payload)
        created.value.message = true
        setTimeout(() => created.value.message = false)
    }).on('messageUpdated', payload => {
        const index = store.settings.emergencyContact?.messages?.findIndex(message => message._id === payload._id)

        if (index !== -1) {
            store.settings.emergencyContact.messages[index] = payload
        } else {
            store.settings.emergencyContact.messages.push(payload)
        }
        updated.value.message = true
        setTimeout(() => updated.value.message = false)
    }).on('messageDeleted', payload => {
        const index = store.settings.emergencyContact?.messages?.findIndex(message => message._id === payload._id)
        if (index !== -1) {
            store.settings.emergencyContact.messages.splice(index, 1)
        }
        deleted.value.message = true
        setTimeout(() => deleted.value.message = false)
    }).on('alertCreated', () => {
        created.value.alert = true
        setTimeout(() => created.value.alert = false)
    }).on('alertDeleted', _id => {
        const index = store.alerts.emergency.findIndex(alert => alert._id === _id)
        if (index !== -1) {
            store.alerts.emergency.splice(index, 1)
        }
        deleted.value.alert = true
        setTimeout(() => deleted.value.alert = false)
    }).on('mostRecentListings', payload => {
        mostRecentListings.value = payload.map(mostRecentListing => JSON.parse(mostRecentListing))
            .sort((listingA, listingB) => (listingA.createdAt || 264330300000) > (listingB.createdAt || 264330300000) ? -1 : 0)
    }).on('mostRecentDiscussions', payload => {
        mostRecentDiscussions.value = payload.filter(discussion => discussion.comments.totalCount > 0)
    }).on('emergencyContact', payload => {
        store.settings.emergencyContact = payload
    }).on('update', payload => {
        const { archived } = payload
        const { listingPid } = archived

        archiveData.value[listingPid] = archived
        loading.value.archive = false
        archiveWaitingToBeReady.value = true

        intervals.value.checkArchiveLinkActive = setInterval(async () => {
            try {
                const response = await fetch(getArchiveURL(listingPid))
                if (response.status == 200) {
                    archiveWaitingToBeReady.value = false
                    /** can't wait on the opaque response because we have no idea what the response code is so just clear the interval
                     * and assume if the web link is ready then the git link should be, particularly since the code was pushed.
                    */
                    clearInterval(intervals.value.checkArchiveLinkActive)
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
