<template>
    <v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
        <nav-header @changeTheme="$emit('changeTheme')" v-model="location" />
        <v-card v-if="archiveData" rounded="xl" class="pa-4 mt-2" :elevation="0">
            <v-card-title>
                <span class="font-weight-bold">Archived content listing of <span style="font-stretch: ultra-condensed">{{ archiveData.listingURL }}</span></span>
            </v-card-title>
            <v-card-subtitle></v-card-subtitle>
            <v-card-text>
                <v-row>
                    <v-col>
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
                    <v-col>
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

const { $api } = getCurrentInstance().appContext.config.globalProperties
const { smAndDown } = useDisplay()
const { VITE_API_SERVER } = import.meta.env
const store = useAppStore()
const archiveData = ref()
const location = ref({})
const plugins = [lgZoom, lgThumbnail, lgShare, lgRotate, lgFullscreen, lgHash, lgComment]
const sio = io(VITE_API_SERVER + '/', {
    transports: ['websocket']
}).on('connect_error', (error) => {
    console.log('CALLBACK ERROR: ' + error)
}).on('error', reason => {
    console.log(reason)
})
const pid = computed(() => location.value.pathname?.split('/')?.[3])
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
    sio.on('connect', () => {
        if (pid.value) {
            sio.emit('getArchive', pid.value, archive => {
                if (archive) {
                    archiveData.value = JSON.parse(archive)
                }
            })
        }
    })
})
</script>