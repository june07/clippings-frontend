<template>
	<v-dialog :persistent="!store.settings.emergencyContact.contacts.length" transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialog" @update:model-value="emit('update:modelValue', dialog)">
		<v-card rounded="xl" class="pa-4" style="opacity: 0.96">
			<v-card-title class="font-weight-light text-center">Emergency Alert Setup</v-card-title>
			<v-card-subtitle class="font-weight-light text-center"></v-card-subtitle>
			<v-card-text>
				<p class="mb-8">At least one emergency contact must be setup to send alerts to. The default message will be used if one is not added.</p>
				<div>
					<span class="text-overline">Your Personal Info</span>
					<v-text-field density="compact" rounded v-model="store.settings.profile.name" label="name" id="profileName" :rules="rules.profileName" @change="changeHandler" />
				</div>
				<div v-if="store.settings.emergencyContact.contacts.length">
					<span class="text-overline">Current Emergency Contacts</span>
					<v-list lines="one">
						<v-list-item v-for="listContact of store.settings.emergencyContact.contacts" :key="listContact._id" :title="listContact.name" @click="setActiveContactHandler(listContact)" :class="listItemClass('contact', listContact._id)" :style="!success && justLoaded ? 'transition: background-color 3s' : ''">
							<template v-slot:prepend>
								<v-avatar size="large" color="amber-lighten-4">
									<span class="text-h5 text-capitalize">{{ listContact.name.substring(0, 1) }}</span>
								</v-avatar>
							</template>
							<template v-slot:subtitle>
								{{ listContact.email }}
								<span :class="listContact.optedIn ? 'text-green' : 'text-red'" class="font-italic font-weight-medium ml-2">{{ listContact.optedIn ? '(confirmed)' : '(not confirmed)' }}</span>
							</template>
						</v-list-item>
					</v-list>
				</div>
				<v-expansion-panels v-model="expansionPanel" multiple>
					<v-expansion-panel title="Update Emergency Contacts" rounded="xl">
						<template v-slot:text>
							<v-text-field tabindex="1" density="compact" rounded v-model="contact.name" label="name" id="name" :rules="rules.name" @change="changeHandler" />
							<v-text-field tabindex="2" density="compact" rounded v-model="contact.email" label="email address" id="email" :rules="rules.email" @change="changeHandler" />
							<v-text-field tabindex="3" density="compact" rounded v-model="contact.relationship" label="relationship" id="relationship" :rules="rules.relationship" @input="changeHandler" />
							<v-btn tabindex="4" v-if="!editing" @click="actionHandler('create:contact', { owner: store.settings.profile, ...contact })" prepend-icon="person_add" density="compact" variant="text" :disabled="disabled['create:contact']" :loading="loading['create:contact']">Add</v-btn>
							<v-btn v-if="editing" @click="actionHandler('update:contact', contact)" prepend-icon="save" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled['update:contact']" :loading="loading['update:contact']"
								>Update</v-btn
							>
							<v-btn v-if="editing" @click="actionHandler('delete:contact', { _id: contact._id })" prepend-icon="delete" density="compact" variant="text" :loading="loading[`delete:alert-${listAlert._id}`]">Delete</v-btn>
							<v-btn v-if="editing" @click="cancelEditHandler" prepend-icon="cancel" density="compact" variant="text">Cancel</v-btn>
						</template>
					</v-expansion-panel>
					<div class="w-100" v-if="userMessages.length">
						<span class="text-overline">Current Emergency Messages</span>
						<v-list lines="one">
							<v-list-item
								v-for="(listMessage, index) of userMessages"
								:key="listMessage._id"
								:title="listMessage.title"
								:subtitle="listMessage.text"
								@click="setActiveMessageHandler(listMessage)"
								:class="listItemClass('message', listMessage._id)"
								:style="!success && justLoaded ? 'transition: background-color 3s' : ''">
								<template v-slot:prepend>
									<v-avatar size="small" color="red-lighten-4">
										<span class="text-h5 text-capitalize">{{ index + 1 }}</span>
									</v-avatar>
								</template>
							</v-list-item>
						</v-list>
					</div>
					<v-expansion-panel title="Update Emergency Message" rounded="xl">
						<template v-slot:text>
							<v-text-field density="compact" rounded v-model="message.title" label="Default Emergency Message" id="title" :rules="rules.title" @change="changeHandler" />
							<v-textarea v-model="message.text" placeholder="“I am lost and my last known action was going to visit someone from this online classified ad...“">
								<template v-slot:placeholder>
									<div class="text-wrap"></div>
								</template>
							</v-textarea>
							<v-btn v-if="!userMessages.length" @click="actionHandler('create:message', message)" prepend-icon="add" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled['create:message']" :loading="loading['create:message']"
								>Add</v-btn
							>
							<v-btn v-if="userMessages.length" @click="actionHandler('update:message', message)" prepend-icon="save" density="compact" variant="text" :color="success ? 'green' : ''" :style="!success ? 'transition: color 3s' : ''" :disabled="disabled['update:message']" :loading="loading['update:message']"
								>Update</v-btn
							>
							<v-btn v-if="userMessages.length" @click="actionHandler('delete:message', { _id: message._id })" prepend-icon="delete" density="compact" variant="text" :loading="loading['delete:message']">Delete</v-btn>
						</template>
					</v-expansion-panel>
					<!--
                    <v-expansion-panel title="Update Emergency Alert Defaults" rounded="xl">
                        <template v-slot:text>
                            
                        </template>
                    </v-expansion-panel>
                    -->
				</v-expansion-panels>
				<div class="text-overline mt-8">Set Emergency Alerts</div>
				<div v-if="!store.alerts.emergency.length" class="text-center">no alerts set</div>
				<v-list v-else lines="one">
					<v-list-item v-for="(listAlert, index) of store.alerts.emergency" :key="listAlert._id" :class="listItemClass('alert', listAlert._id)" :style="!success && justLoaded ? 'transition: background-color 3s' : ''">
						<template v-slot:prepend>
							<v-chip size="small" color="red-darken-2" class="mr-4">
								<span class="text-h6 text-capitalize">{{ index + 1 }}</span>
							</v-chip>
						</template>
						<template v-slot:title>
							<div class="font-weight-medium">{{ listAlert.listingPid }} (to: {{ listAlert.to.map(to => to.name).join(',') }})</div>
						</template>
						<template v-slot:subtitle>
							<div class="text-caption">Sending on {{ new Date(listAlert.sendAt).toLocaleString() }}</div>
						</template>
						<template v-slot:append>
							<v-btn @click="actionHandler('delete:alert', { _id: listAlert._id })" density="compact" variant="plain" :loading="loading[`delete:alert-${listAlert._id}`]">Cancel</v-btn>
						</template>
					</v-list-item>
				</v-list>
			</v-card-text>
			<v-card-actions class="d-flex flex-column align-center">
				<v-btn :color="store.settings.emergencyContact.contacts.length ? 'success' : ''" :disabled="!store.settings.emergencyContact.contacts.length || disabled.okay" :prepend-icon="success ? 'check' : undefined" variant="tonal" rounded block @click="dialog = false">Okay</v-btn>
				<v-btn class="mt-2" variant="text" rounded block @click="dialog = false" prepend-icon="close">Close</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<style scoped>
.active-list-item {
	border-radius: 24px;
}

.contact.active-list-item.success,
.message.active-list-item.success {
	background-color: green;
}

.message.active-list-item {
	background-color: #ffebee;
}

.contact.active-list-item {
	background-color: #ffecb3;
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
	createdAlert: Boolean,
	updatedAlert: Boolean,
	deletedAlert: Boolean,
	createdContact: Boolean,
	updatedContact: Boolean,
	deletedContact: Boolean,
	createdMessage: Boolean,
	updatedMessage: Boolean,
	deletedMessage: Boolean,
})
const emit = defineEmits(['update:modelValue', 'create:contact', 'update:contact', 'delete:contact', 'create:message', 'update:message', 'delete:message'])
const userMessages = computed(() => store.settings.emergencyContact.messages.filter(message => message.owner !== 'system'))

const { smAndDown } = useDisplay()
const dialog = ref(props.modelValue)
const editing = ref(false)
const success = ref(false)
const contactObj = {
	name: undefined,
	email: undefined,
	relationship: undefined,
}
const contact = ref({
	...contactObj,
})
const message = ref({})
const messageDiff = ref()
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
const loading = ref({
	default: false,
	'create:contact': false,
	'update:contact': false,
	'delete:contact': false,
	'create:message': false,
	'update:message': false,
	'delete:message': false,
	'delete:alert': false,
})
const justLoaded = ref(false)
const isValid = ref({
	profileName: store.settings.profile.name ? true : false,
	...contactObj,
})
const disabled = computed(() => ({
	'create:contact': ![isValid.value['profileName'], isValid.value['name'], isValid.value['email'], isValid.value['relationship']].every(valid => valid),
	'update:contact': JSON.stringify(contact.value) === JSON.stringify(contactDiff.value),
	'create:message': false,
	'update:message': JSON.stringify(message.value) === JSON.stringify(messageDiff.value),
	okay: !isValid.value.profileName || !store.settings.emergencyContact.contacts.length,
}))
const rules = {
	email: [v => !!v || `Email is required.`, v => !v || (v && /.+@.+\..+/.test(v)) || 'Email must be valid'],
	name: [v => !!v || `Name is required.`],
	profileName: [v => !!v || `Name is required.`],
	title: [v => !v || (v && v.length < 100) || `Title is too long.`],
	relationship: [v => !!v || `Relationship is required.`],
}
watch(dialog, value => emit('update:modelValue', value))
watch(
	() => props.modelValue,
	value => (dialog.value = value)
)
watch(
	() => props.createdContact,
	value => {
		loading.value['create:contact'] = false
		justLoaded.value = true
		success.value = true
		setTimeout(() => (success.value = false))
		setTimeout(() => (justLoaded.value = false), 3000)
		cancelEditHandler()
	}
)
watch(
	() => props.updatedContact,
	value => {
		loading.value['update:contact'] = false
		justLoaded.value = true
		success.value = true
		setTimeout(() => (success.value = false))
		setTimeout(() => (justLoaded.value = false), 3000)
		contactDiff.value = { ...contact.value }
	}
)
watch(
	() => props.deletedContact,
	() => {
		loading.value['delete:contact'] = false
		justLoaded.value = true
		success.value = true
		setTimeout(() => (success.value = false))
		setTimeout(() => (justLoaded.value = false), 3000)
		cancelEditHandler()
	}
)
watch(
	() => props.updatedMessage,
	value => {
		if (value) {
			loading.value['create:message'] = false
			loading.value['update:message'] = false
			loading.value['delete:message'] = false
			justLoaded.value = true
			success.value = true
			setTimeout(() => (success.value = false))
			setTimeout(() => (justLoaded.value = false), 3000)
			messageDiff.value = { ...message.value }
		}
	}
)
watch(
	() => props.updatedAlert,
	value => {
		if (value) {
			loading.value['create:alert'] = false
			loading.value['update:alert'] = false
			loading.value['delete:alert'] = false
			justLoaded.value = true
			success.value = true
			setTimeout(() => (success.value = false))
			setTimeout(() => (justLoaded.value = false), 3000)
		}
	}
)
const changeHandler = event => {
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
function setActiveMessageHandler(activeMessage) {
	message.value = { ...activeMessage }
	messageDiff.value = { ...activeMessage }
	if (!expansionPanel.value.includes(1)) {
		expansionPanel.value.push(1)
	}
}
function actionHandler(action, value) {
	const loadingKey = value._id && `${action}-${value._id}`

	loading.value[action] = true
	if (loadingKey) {
		loading.value[loadingKey] = true
	}
	emit(action, value)
	setTimeout(() => {
		loading.value[action] = false
		if (loadingKey) {
			loading.value[loadingKey] = false
		}
	}, 5000)
}
function cancelEditHandler() {
	editing.value = false
	contact.value = { ...contactObj }
	contactDiff.value = { ...contactObj }
}
function listItemClass(component, id) {
	if (component === 'contact') {
		return id === contact.value?._id ? `contact active-list-item${success.value ? ' success' : ''}` : ''
	} else if (component === 'message') {
		return id === message.value?._id ? `message active-list-item${success.value ? ' success' : ''}` : ''
	}
}
</script>
