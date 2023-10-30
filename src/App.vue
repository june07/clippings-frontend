<template>
    <v-app ref="clippings" :class="{ 'blur': showCredits, 'mobile': smAndDown }" :theme="store.theme">
        <v-navigation-drawer v-if="!smAndDown" order="2" width="200" floating location="left">
            <div class="h-100 d-flex align-center">
                <a href="https://www.digitalocean.com/?refcode=fe4184318b19&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge"><img src="https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%202.svg" style="width: 200px; height: 65px" alt="DigitalOcean Referral Badge" /></a>
            </div>
        </v-navigation-drawer>
        <v-main>
            <contact-confirmation v-if="location.pathname && /^\/contact-confirmation\//.test(location.pathname)" />
            <craigslist-archive v-else-if="location.pathname && !/^\/archive\/cl\//.test(location.pathname)" @change-theme="themeHandler" @error="errorHandler" />
            <craigslist-archived-ad v-else-if="location.pathname" @change-theme="themeHandler" />
        </v-main>
        <v-navigation-drawer v-if="!smAndDown" order="2" width="200" floating location="right">
            <div class="h-100 d-flex align-center">
                <a href="https://www.digitalocean.com/?refcode=fe4184318b19&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge"><img src="https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg" style="width: 200px; height: 65px" alt="DigitalOcean Referral Badge" /></a>
            </div>
        </v-navigation-drawer>
        <v-snackbar text :timeout="-1" v-model="snackbar.active" style="opacity: 0.9" @click="snackbarCloseHandler">
            <v-row>
                <v-col cols="1" class="d-flex align-center justify-center">
                    <v-icon :icon="snackbar.icon" :color="snackbar.iconColor"/>
                </v-col>
                <v-col cols="10" class="d-flex align-center justify-center">
                    <span v-if="error">{{ snackbar.message }}</span>
                    <span v-else @click="reload" class="font-weight-light" v-bind:class="smAndDown ? 'caption' : ''" style="cursor: pointer">App update available.</span>
                </v-col>
                <v-col cols="1" class="d-flex align-center justify-center">
                    <v-btn variant="plain" :size="smAndDown ? 'x-small' : ''" @click="snackbarCloseHandler"> x </v-btn>
                </v-col>
            </v-row>
        </v-snackbar>
    </v-app>
</template>
<style>
html {
    font-stretch: condensed !important;
    font-size: large !important;
}
</style>
<script setup>
import { ref, getCurrentInstance, onMounted, provide } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'

import CraigslistArchive from '@/views/CraigslistArchive.vue'
import CraigslistArchivedAd from '@/views/CraigslistArchivedAd.vue'
import ContactConfirmation from '@/views/ContactConfirmation.vue'

const error = ref(false)
const { smAndDown } = useDisplay()
const store = useAppStore()
const { $api } = getCurrentInstance().appContext.config.globalProperties
const version = ref()
const snackbarDefault = {
    active: false,
    icon: 'info',
    message: undefined
}
const snackbar = ref({ ...snackbarDefault })
const lastBuild = ref()
const showCredits = ref(false)
const versionCheckIntervalId = ref()
const buildInfo = ref()
const location = ref({})

const checkVersion = async () => {
    buildInfo.value = await $api.buildInfo()

    if (!buildInfo.value?.build_date) {
        return
    }
    version.value = buildInfo.value.commit_sha
    if (
        lastBuild.value &&
        lastBuild.value?.build_date !== buildInfo.value.build_date
    ) {
        snackbar.value.active = true
    } else {
        lastBuild.value = buildInfo.value
    }
}
function errorHandler(errorMessage) {
    error.value = true
    snackbar.value = {
        active: true,
        icon: 'error',
        iconColor: 'red',
        message: errorMessage
    }
}
function snackbarCloseHandler() {
    snackbar.value.active = false
    setTimeout(() => {
        snackbar.value = { ...snackbarDefault }
        if (error) {
            error.value = false
        }
    }, 500)
}
function reload() {
    const url = new URL(window.location.href)
    url.searchParams.set('cache', Date.now())
    window.location.href = url.toString()
}
globalThis.reload = reload
function themeHandler() {
    store.theme = store.theme === "light" ? "dark" : "light"
}
checkVersion()

versionCheckIntervalId.value = setInterval(checkVersion, 60000)
onMounted(() => {
    location.value = window.location
})

const pidFromURL = (url) => url && url.match(/\/([^\/]*)\.html/)?.[1]
const shortenAdURL = (url) => url && url.match(/https?:\/\/[^/]*(.*)/)?.[1] ? `...${url.match(/https?:\/\/[^/]*(.*)/)[1]}` : ''
const getCodeURL = (pid) => pid && `https://github.com/june07/clippings-archive/tree/main/craigslist/${pid}`
const getWebURL = (pid) => pid && location.value && `${location.value.origin}/archive/cl/${pid}`
const getArchiveURL = (pid) => pid && `https://clippings-archive.june07.com/craigslist/${pid}`

provide('pidFromURL', pidFromURL)
provide('shortenAdURL', shortenAdURL)
provide('getCodeURL', getCodeURL)
provide('getWebURL', getWebURL)
provide('getArchiveURL', getArchiveURL)
</script>
