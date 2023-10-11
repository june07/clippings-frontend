<template>
    <v-menu v-model="menu" @update:model-value="value => !value && emit('closed')">
        <template v-slot:activator="{ props: menu }">
            <v-tooltip text="Copied" v-model="tooltips.share" location="top" :open-on-hover="false">
                <template v-slot:activator="{ props: tooltip }">
                    <v-btn :icon="icon ? 'share' : undefined" :class="buttonClass" :prepend-icon="!icon ? 'share' : undefined" v-bind="mergeProps(menu, tooltip)" :variant="variant" :size="size" :color="color" :rounded="rounded" :density="density" :text="text" />
                </template>
            </v-tooltip>
        </template>
        <v-list class="rounded-xl">
            <v-list-item v-for="shareType in shareTypes" :key="shareType.network" density="compact">
                <div style="cursor: pointer" v-if="/copy|tab/.test(shareType.network)" @click="() => clickHandler(shareType)">
                    <v-icon :icon="shareType.icon" class="mr-2"></v-icon>{{ shareType.title }}
                </div>
                <ShareNetwork v-else :url="url" :network="shareType.network" :title="title" :description="description" :quote="quote" :hashtags="hashtags" :twitterUser="twitterUser" class="d-flex">
                    <v-icon class="mr-2" :color="shareType.color" v-if="!shareType.network.match(/twitter|whatsapp/)">
                        <v-icon size="x-small" :icon="shareType.icon" />
                    </v-icon>
                    <icon-base height="24" width="24" class="mr-2" v-else :icon-name="shareType.title">
                        <icon-twitter v-if="shareType.network.match(/twitter/)"></icon-twitter>
                        <icon-whatsapp v-if="shareType.network.match(/whatsapp/)"></icon-whatsapp>
                    </icon-base>
                    <div>{{ shareType.title }}</div>
                </ShareNetwork>
            </v-list-item>
        </v-list>
    </v-menu>
</template>
<style scoped>
a {
    text-decoration: none !important;
}
</style>
<script setup>
import { ref, inject, mergeProps, watch } from 'vue'
import { ShareNetwork } from 'vue-social-sharing'

import IconBase from './IconBase'
import IconTwitter from './IconTwitter'
import IconWhatsapp from './IconWhatsapp'

const menu = ref()
const tooltips = ref({
    share: false
})
const props = defineProps({
    url: {
        type: String,
        default: 'https://clippings.june07.com'
    },
    text: {
        type: String,
        default: 'share'
    },
    copy: String,
    size: String,
    density: String,
    icon: String,
    color: String,
    rounded: Boolean,
    variant: {
        type: String,
        default: 'text'
    },
    title: {
        type: String,
        default: 'Clippings is your modern-day archival tool for online classified ads.'
    },
    description: String,
    quote: String,
    hashtags: String,
    disabled: Array,
    buttonClass: String,
    modelValue: Boolean
})
const emit = defineEmits(['copy', 'qrclicked', 'closed'])
const twitterUser = "june07"
const shareTypes = [
    {
        network: "tab",
        title: "Open Tab",
        icon: "tab",
    },
    {
        network: "copy",
        title: "Copy Link",
        icon: "content_copy",
    },
    {
        network: "email",
        title: "Email",
        icon: "email",
        color: "#333333",
    },
    {
        network: "facebook",
        title: "Facebook",
        icon: "facebook",
        color: "#1877f2",
    },
    {
        network: "sms",
        title: "SMS",
        icon: "sms",
        color: "#333333",
    },
    {
        network: "twitter",
        title: "Twitter",
        icon: "",
        color: "#1da1f2",
    },
    {
        network: "whatsapp",
        title: "Whatsapp",
        icon: "",
        color: "#25d366",
    },
]
    .filter(shareType => !props.disabled?.includes(shareType.network))
    .filter(shareType => !(shareType.network === 'tab' && props.url !== document.location.href))

function copyHandler() {
    emit('copy')
    tooltips.value['share'] = true
    clipboard.copy(props.url)
    setTimeout(() => {
        tooltips.value['share'] = false
    }, 500)
}
function clickHandler(shareType) {
    if (shareType.network === 'copy') {
        copyHandler()
    } else if (shareType.network === 'tab') {
        const newWindow = window.open(props.url, '_blank')
        newWindow.opener = null
    }
}
const clipboard = inject('clipboard')
watch(() => props.modelValue, modelValue => {
    menu.value = modelValue
})
</script>
