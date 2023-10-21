<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <nav-header @changeTheme="$emit('changeTheme')" v-model="location" />
        <v-card v-if="archiveData" rounded="xl" class="mt-2" :class="smAndDown ? 'pa-0' : 'pa-4'" :elevation="0" :width="smAndDown ? '-webkit-fill-available' : '800px'">
            <v-card-title>
                <span class="font-weight-bold">Archived content listing of <span v-if="!smAndDown" style="font-stretch: ultra-condensed">{{ archiveData.listingURL }}</span></span>
            </v-card-title>
            <v-card-subtitle><span style="text-wrap: pretty">{{ archiveData.listingURL }}</span></v-card-subtitle>
            <v-card-text>
                <v-btn v-if="!alert" variant="text" density="compact" color="red-accent-4" text="Set Alert" prepend-icon="emergency_share" @click="dialogs.emergencyAlert = !dialogs.emergencyAlert" :loading="loading['create:alert']" />
                <v-alert v-else-if="!alert.receipt" type="warning" variant="outlined" :title="`Alert set to send at ${new Date(alert.sendAt).toLocaleString()}`" text="Your emergency contacts will receive your message if you fail to cancel this alert before the set time.">
                    <template v-slot:append>
                        <v-btn variant="text" density="compact" color="red-accent-4" :text="smAndDown ? undefined : 'Delete Alert'" :prepend-icon="smAndDown ? undefined : 'emergency_share'" :icon="smAndDown ? 'delete' : undefined" @click="actionHandler({ deleteAlert: { _id: alert._id } })" :loading="loading['delete:alert']" />
                    </template>
                </v-alert>
                <v-alert v-else type="info" variant="outlined" :title="`Alert sent at ${new Date(alert.receipt.sentAt).toLocaleString()}`" :text="`Send receipt id: ${alert._id}`">
                </v-alert>
                <v-row>
                    <v-col :cols="smAndDown ? 12 : 6">
                        <div class="my-2 text-overline">Raw Links</div>
                        <ul>
                            <li><a :href="`${getArchiveURL(archiveData.listingPid)}/${archiveData.listingPid}.html`">{{ `${archiveData.listingPid}.html` }}</a></li>
                            <li v-for="image of archiveData.imageUrls"><a :href="`${getArchiveURL(archiveData.listingPid)}/${image.split('/').pop()}`">{{ image.split('/').pop() }}</a></li>
                        </ul>
                        <div class="my-2 text-overline">Gallery</div>
                        <lightgallery :settings="{ speed: 500, plugins: plugins }">
                            <a v-for="image of archiveData.imageUrls" :href="`${getArchiveURL(archiveData.listingPid)}/${image.split('/').pop()}`" class="mr-1"><img height="150" width="150" :src="`${getArchiveURL(archiveData.listingPid)}/${image.split('/').pop()}`" style="border-radius: 12px;" /></a>
                        </lightgallery>
                    </v-col>
                    <v-col :cols="smAndDown ? 12 : 6">
                        <div class="my-2 text-overline">Craigslist Snapshot</div>
                        <div class="iframe-wrapper" style="height: 500px">
                            <iframe :src="`${getArchiveURL(archiveData.listingPid)}/${archiveData.listingPid}.html`" style="
                                width: 100%;
                                height: 100%;
                                border: none;
                                zoom: 0.90;
                                -moz-transform: scale(0.90);
                                -moz-transform-origin: 0 0;
                                -o-transform: scale(0.90);
                                -o-transform-origin: 0 0;
                                -webkit-transform: scale(0.90);
                                -webkit-transform-origin: 0 0;
                            "></iframe>
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <Giscus v-if="archiveData" class="giscus" repo="june07/clippings-comments" repo-id="R_kgDOKZ-3jA" category="Announcements" category-id="DIC_kwDOKZ-3jM4CZvZb" mapping="specific" :term="archiveData.listingPid" strict="0" reactions-enabled="1" emit-metadata="1" input-position="bottom" theme="preferred_color_scheme" lang="en" />
        <v-spacer />
        <emergency-alert-dialog v-model="dialogs.emergencyAlert" @close="dialogs.emergencyAlert = false" :listingPid="listingPid" :adURL="archiveData?.url" @create:alert="alertHandler" :created="updated.alert" />
    </v-container>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, computed } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import cookie from 'cookie'
import Lightgallery from 'lightgallery/vue'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import lgZoom from 'lightgallery/plugins/zoom'
import lgShare from 'lightgallery/plugins/share'
import lgRotate from 'lightgallery/plugins/rotate'
import lgFullscreen from 'lightgallery/plugins/fullscreen'
import lgHash from 'lightgallery/plugins/hash'
import lgComment from 'lightgallery/plugins/comment'
import 'lightgallery/scss/lightgallery-bundle.scss'
import Giscus from '@giscus/vue'

import NavHeader from '@/components/NavHeader.vue'
import EmergencyAlertDialog from '@/components/EmergencyAlertDialog.vue'

const { $api } = getCurrentInstance().appContext.config.globalProperties
const { smAndDown } = useDisplay()
const { VITE_API_SERVER } = import.meta.env
const store = useAppStore()
const archiveData = ref()
const location = ref({})
const plugins = [lgZoom, lgThumbnail, lgShare, lgRotate, lgFullscreen, lgHash, lgComment]
const listingPid = computed(() => location.value.pathname?.split('/')?.[3])
const alert = computed(() => store.alerts.emergency.find(alert => alert.listingPid == listingPid.value))
const loading = ref({
    default: false,
    'create:alert': false,
    'update:alert': false,
    'delete:alert': false
})
const dialogs = ref({
    emeemergencyAlert: false
})
const updated = ref({
    alert: false
})
const sio = io(VITE_API_SERVER + '/', {
    transports: ['websocket']
}).on('connect_error', (error) => {
    console.log('CALLBACK ERROR: ' + error)
}).on('error', reason => {
    console.log(reason)
}).on('connect', () => {
    if (listingPid.value) {
        sio.emit('getArchive', listingPid.value, archive => {
            if (archive) {
                archiveData.value = JSON.parse(archive)
            }
        })
        sio.emit('readAlerts', {}, alerts => store.alerts.emergency = alerts)
    }
}).on('alertCreated', alert => {
    store.alerts.emergency.push(alert)
    updated.value.alert = true
    setTimeout(() => updated.value.alert = false)
    loading.value['create:alert'] = false
}).on('alertDeleted', _id => {
    const index = store.alerts.emergency.findIndex(alert => alert._id === _id)
    if (index !== -1) {
        store.alerts.emergency.splice(index, 1)
    }
    updated.value.alert = true
    setTimeout(() => updated.value.alert = false)
    loading.value['delete:alert'] = false
})
function alertHandler(params) {
    const alert = {
        listingPid: listingPid.value,
        ...params
    }
    sio.emit('createAlert', alert)
}
function actionHandler(event) {
    sio.emit(Object.keys(event)[0], Object.values(event)[0])
}
const getArchiveURL = (pid) => pid && `https://clippings-archive.june07.com/craigslist/${pid}`
onMounted(() => {
    if (!store.sessionId) {
        (async () => {
            await $api.info()
            store.sessionId = cookie.parse(window.document.cookie)?.['connect.sid']?.match(/s:([^\.]*)/)[1]
            sio.auth = { sessionId: store.sessionId }
            sio.connect()
        })()
    } else {
        sio.auth = { sessionId: store.sessionId }
        sio.connect()
    }
})
</script>