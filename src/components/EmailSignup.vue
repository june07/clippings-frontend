<template>
    <v-container class="pa-0">
        <div v-if="!store.subscribed.daily">
            <div class="text-caption text-center" v-html="title"></div>
            <v-form class="d-flex align-center">
                <v-btn variant="tonal" rounded color="black" size="small" class="mr-2" text="subscribe" :disabled="!isValid || loading" @click="clickHandler" :loading="loading" />
                <v-text-field validate-on="lazy" density="compact" variant="outlined" rounded="lg" v-model="store.textFieldEmail" hide-details :rules="rules.email" placeholder="email address" @input="changeHandler" />
            </v-form>
        </div>
        <v-dialog transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialog">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Thanks for subscribing!</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Check your inbox for a confirmation link.</v-card-subtitle>
                <v-card-text class="text-body-1">
                    <p>Please check your inbox for a confirmation email. We just want to make sure you're all set to receive our updates.</p>
                    <p class="mt-4">Once you click <i>Confirm</i> in the email, you're good to go. 📧👍</p>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs';

const { smAndDown } = useDisplay()
const emit = defineEmits(['signup'])
const props = defineProps({
    type: String,
    subscribed: Boolean
})
const isValid = ref(false)
const loading = ref(false)
const dialog = ref(false)
const title = computed(() => {
    if (props.type === 'daily') {
        return `Stay informed with <span class="font-weight-bold">Clippings Chronicles</span>, a list of most popular archived ads each day.`
    }
})
const store = useAppStore()
const rules = {
    email: [
        (v) => !!v || `Email is required.`,
        v => !v || v && /.+@.+\..+/.test(v) || "Email must be valid",
    ]
}
const changeHandler = () => {
    isValid.value = rules.email.every(rule => typeof rule(store.textFieldEmail) !== 'string' && rule(store.textFieldEmail))
}
const clickHandler = () => {
    emit('signup')
    loading.value = true
    setTimeout(() => loading.value = false, 10000)
}
watch(() => props.subscribed, value => {
    loading.value = false
    if (value) {
        store.subscribed.daily = store.textFieldEmail
        dialog.value = true
    }
})

</script>
