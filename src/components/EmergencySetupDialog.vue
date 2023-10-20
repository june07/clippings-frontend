<template>
    <v-dialog :persistent="!store.settings.emergencyContact.contacts.length" transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialog" @update:model-value="emit('update:modelValue', dialog)">
        <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
            <v-card-title class="font-weight-light text-center">Emergency Alert Setup</v-card-title>
            <v-card-subtitle class="font-weight-light text-center"></v-card-subtitle>
            <v-card-text>
                <p class="mb-8">
                    At least one emergency contact must be setup to send alerts to. The default message will be used if one is not added.
                </p>
                <div v-if="store.settings.emergencyContact?.contacts?.length">
                    <span class="text-overline">Your Personal Info</span>
                    <v-text-field density="compact" rounded v-model="store.settings.profile.name" label="name" id="profileName" :rules="rules.profileName" @change="changeHandler" />
                </div>
                <div v-if="store.settings.emergencyContact?.contacts?.length">
                    <span class="text-overline">Current Emergency contacts</span>
                    <v-list lines="one">
                        <v-list-item v-for="listContact of store.settings.emergencyContact.contacts" :key="listContact._id" :title="listContact.name" :subtitle="listContact.email" @click="setActiveContactHandler(listContact)" :class="listItemClass(listContact._id)" :style="!success && justLoaded ? 'transition: background-color 3s' : ''">
                            <template v-slot:prepend>
                                <v-avatar size="large" color="amber-lighten-4">
                                    <span class="text-h5 text-capitalize">{{ listContact.name.substring(0, 1) }}</span>
                                </v-avatar>
                            </template>
                        </v-list-item>
                    </v-list>
                </div>
                <v-expansion-panels v-model="expansionPanel" multiple>
                    <v-expansion-panel title="Update Emergency Contacts" rounded="xl">
                        <template v-slot:text>
                            <v-text-field tabindex="1" density="compact" rounded v-model="contact.name" label="name" id="name" :rules="rules.name" @change="changeHandler" />
                            <v-text-field tabindex="2" density="compact" rounded v-model="contact.email" label="email address" id="email" :rules="rules.email" @change="changeHandler" />
                            <v-text-field tabindex="3" density="compact" rounded v-model="contact.relationship" label="relationship" id="relationship" :rules="rules.relationship" @change="changeHandler" />
                            <v-btn tabindex="4" v-if="!editing" @click="createContactHandler" prepend-icon="person_add" density="compact" variant="text" :disabled="disabled.add" :loading="loading.addContact">Add</v-btn>
                            <v-btn v-if="editing" @click="updateContactHandler" prepend-icon="save" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled.update">Update</v-btn>
                            <v-btn v-if="editing" @click="deleteContactHandler" prepend-icon="delete" density="compact" variant="text">Delete</v-btn>
                            <v-btn v-if="editing" @click="cancelEditHandler" prepend-icon="cancel" density="compact" variant="text">Cancel</v-btn>
                        </template>
                    </v-expansion-panel>
                    <v-expansion-panel title="Update Emergency Message" rounded="xl">
                        <template v-slot:text>
                            <v-textarea placeholder="“I am lost and my last known action was going to visit someone from this online classified ad...“">
                                <template v-slot:placeholder>
                                    <div class="text-wrap"></div>
                                </template>
                            </v-textarea>
                            <v-btn v-if="!store.settings.emergencyContact.messages.length" @click="actionHandler('create:message')" prepend-icon="add" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled.update">Add</v-btn>
                            <v-btn v-if="store.settings.emergencyContact.messages.length" @click="actionHandler('update:message')" prepend-icon="save" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled.update">Update</v-btn>
                            <v-btn v-if="store.settings.emergencyContact.messages.length" @click="actionHandler('delete:message')" prepend-icon="delete" density="compact" variant="text">Delete</v-btn>
                        </template>
                    </v-expansion-panel>
                    <v-expansion-panel title="Update Emergency Alert Defaults" rounded="xl">
                        <template v-slot:text>
                            
                        </template>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card-text>
            <v-card-actions class="d-flex justify-center">
                <v-btn :color="store.settings.emergencyContact.contacts.length ? 'success' : ''" :disabled="!store.settings.emergencyContact.contacts.length || disabled.okay" prepend-icon="check" variant="tonal" rounded block @click="dialog = false">Okay</v-btn>
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
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import 'animate.css'

const store = useAppStore()
const props = defineProps({
    modelValue: Boolean,
    updatedContact: Boolean
})
const emit = defineEmits(['update:modelValue', 'create:contact', 'update:contact', 'delete:contact', 'create:message', 'update:message', 'delete:message'])
const { smAndDown } = useDisplay()
const dialog = ref(props.modelValue)
const editing = ref(false)
const success = ref(false)
const contactObj = {
    name: undefined,
    email: undefined,
    relationship: undefined
}
const contact = ref({
    ...contactObj
})
const expansionPanelInitialState = () => {
    let state = []
    if (!store.settings.emergencyContact.contacts.length) {
        state.push(0)
    }
    if (!store.settings.emergencyContact.messages.length) {
        // state.push(1)
    }
    return state
}
const expansionPanel = ref(expansionPanelInitialState())
const contactDiff = ref()
const loading = ref(false)
const justLoaded = ref(false)
const isValid = ref({
    profileName: false,
    ...contactObj
})
const disabled = computed(() => ({
    add: !Object.values(isValid.value)?.every(valid => valid),
    okay: !isValid.value.profileName,
    update: JSON.stringify(contact.value) === JSON.stringify(contactDiff.value)
}))
const rules = {
    email: [
        (v) => !!v || `Email is required.`,
        v => !v || v && /.+@.+\..+/.test(v) || "Email must be valid",
    ],
    name: [
        (v) => !!v || `Name is required.`,
    ],
    profileName: [
        (v) => !!v || `Name is required.`,
    ],
    relationship: [
        (v) => !!v || `Relationship is required.`,
    ]
}
watch(() => dialog, value => emit('update:modelValue', value))
watch(() => props.modelValue, value => dialog.value = value)
watch(() => props.updatedContact, value => {
    if (value) {
        loading.value = false
        justLoaded.value = true
        success.value = true
        setTimeout(() => success.value = false)
        setTimeout(() => justLoaded.value = false, 3000)
        contactDiff.value = { ...contact.value }
    }
})
const changeHandler = (event) => {
    isValid.value[event.target.id] = rules[event.target.id].every(rule => typeof rule(event.target.value) !== 'string' && rule(event.target.value))
}
function setActiveContactHandler(activeContact) {
    editing.value = true
    contact.value = { ...activeContact }
    contactDiff.value = { ...activeContact }
    if (!expansionPanel.value.includes(0)) {
        expansionPanel.value.push(0)
    }
}
function createContactHandler() {
    loading.value = true
    emit('create:contact', contact.value)
    setTimeout(() => loading.value = false, 5000)
}
function updateContactHandler() {
    loading.value = true
    emit('update:contact', contact.value)
    setTimeout(() => loading.value = false, 5000)
}
function deleteContactHandler() {
    loading.value = true
    emit('delete:contact', contact.value._id)
    setTimeout(() => loading.value = false, 5000)
}
function actionHandler(action, value) {
    loading.value = true
    emit(action, value)
    setTimeout(() => loading.value = false, 5000)
}
function cancelEditHandler() {
    editing.value = false
    contact.value = {
        ...contactObj
    }
}
function listItemClass(id) {
    const className = id === contact.value?._id ? `active-list-item${success.value ? ' success' : ''}` : ''
    return className
}
</script>