<template>
    <v-dialog persistent no-click-animation :retain-focus="false" transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialog" @update:model-value="emit('update:modelValue', dialog)">
        <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
            <v-card-title class="font-weight-light text-center">Emergency Alert Setup</v-card-title>
            <v-card-subtitle class="font-weight-light text-center">Ad: {{ adURL }}</v-card-subtitle>
            <v-card-text>
                <p class="mb-8">
                    Emergency alerts are set to a future time/date and can be canceled by only you. If not canceled they will be sent to your emergency contact(s)
                </p>
                <div>
                    <div class="text-overline">emergency contact(s)</div>
                    <v-select v-model="alert.to" :items="store.settings.emergencyContact.contacts" item-title="name" item-value="_id" multiple />
                    <div class="text-overline">emergency message</div>
                    <v-select v-model="alert.message" :items="store.settings.emergencyContact.messages" item-title="title" item-value="_id" />
                    <div class="text-overline">time to send message</div>
                    <flat-pickr ref="calendar" v-model="alert.sendAt" :config="flatPickrConfig" placeholder="Select time" name="time" />
                </div>
                <div class="mt-8">
                    You just need to click "Okay" and you're all set. Remember to cancel this emergency alert after you safely arrive back from your meetup.
                </div>
            </v-card-text>
            <v-card-actions class="d-flex justify-center">
                <v-btn color="green" :variant="success ? 'tonal' : 'text'" :disabled="!store.settings.emergencyContact.contacts.length" :append-icon="success ? 'check' : undefined" variant="tonal" rounded block @click="setupHandler">Okay</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<style scoped>
.active-list-item {
    background-color: #FFECB3;
    border-radius: 24px;
}

.active-list-item.success {
    background-color: green;
}
</style>
<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

const flatPickrConfig = ref({
    enableTime: true,
    dateFormat: "F j, Y h:i K",
})
const store = useAppStore()
const props = defineProps({
    modelValue: Boolean,
    created: Boolean,
    adURL: String
})
const emit = defineEmits(['update:modelValue', 'create:alert', 'close'])
const { smAndDown } = useDisplay()
const alert = ref({
    from: store.settings.profile.name,
    to: store.settings.emergencyContact.contacts.map(contact => contact._id),
    message: store.settings.emergencyContact.messages[0]?._id,
    sendAt: Date.now() + (3 * 3_600_000)
})
const calendar = ref('calendar')
const dialog = ref(props.modelValue)
const success = ref(false)
const loading = ref(false)
watch(() => props.created, value => {
    if (value) {
        success.value = value
        setTimeout(() => emit('close'), 1000)
    }
})
watch(() => dialog, value => emit('update:modelValue', value))
watch(() => props.modelValue, value => dialog.value = value)
const setupHandler = () => {
    if (success.value) return
    loading.value = true
    emit('create:alert', alert.value)
    setTimeout(() => {
        success.value = false
        loading.value = false
    }, 5000)
}
</script>