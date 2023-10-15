<template>
    <div class="d-flex align-center" :style="smAndDown ? 'width: -webkit-fill-available' : 'width: 800px'">
        <div class="d-flex align-center justify-start">
            <icon-base><icon-logo iconColor="white" /></icon-base>
            <span v-if="!smAndDown"><span class="font-weight-bold ml-2 mr-1">Clippings</span><span class="mr-2 font-weight-thin font-italic">by June07</span></span>
            <v-btn variant="text" size="small" prepend-icon="home" href="/home" v-if="modelValue.pathname !== '/home'">home</v-btn>
        </div>
        <v-spacer />
        <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="email" :icon="smAndDown ? 'email' : undefined" href="mailto://support@june07.com" text="email" />
        <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="web" :icon="smAndDown ? 'web' : undefined" href="https://june07.com" text="blog" />
        <social-share size="small" :density="smAndDown ? 'compact' : 'default'" :icon="smAndDown ? 'share' : undefined" :url="modelValue.href" />
        <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="help" :icon="smAndDown ? 'help' : undefined" href="https://blog.june07.com/clippings-frequently-asked-questions/" text="faq" />
        <v-btn variant="text" size="small" :density="smAndDown ? 'compact' : 'default'" prepend-icon="toll" :icon="smAndDown ? 'toll' : undefined" href="https://blog.june07.com/donate" text="donate" />
        <v-btn variant="text" size="x-small" :icon="store.theme === 'light' ? 'light_mode' : 'dark_mode'" id="theme" @click="$emit('changeTheme')" />
    </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import { useAppStore } from '@/store/app'

import IconBase from '@/components/IconBase.vue'
import IconLogo from '@/components/IconLogo.vue'
import SocialShare from '@/components/SocialShare.vue'

defineProps({
    modelValue: Object
})
const emit = defineEmits(['update:modelValue'])

const { smAndDown } = useDisplay()
const store = useAppStore()

onMounted(() => {
    emit('update:modelValue', window.location)
})
</script>