<template>
	<v-dialog :persistent="persistent" no-click-animation :retain-focus="false" transition="dialog-bottom-transition" width="auto" :min-width="smAndDown ? '100%' : undefined" :max-width="smAndDown ? undefined : 700" v-model="dialog" @update:model-value="emit('update:modelValue', dialog)">
		<v-card rounded="xl" class="pa-4" style="opacity: 0.96">
			<v-card-title class="font-weight-light text-center">Set Emergency Alert {{ persistent }}</v-card-title>
			<v-card-subtitle class="font-weight-light text-center">Ad: {{ adURL }}</v-card-subtitle>
			<v-card-text>
				<p class="mb-8">Emergency alerts are set to a future time/date and can be canceled by only you. If not canceled they will be sent to your emergency contact(s)</p>
				<div>
					<div class="text-overline">emergency contact(s)</div>
					<v-select v-model="alert.to" :items="store.settings.emergencyContact.contacts" item-title="name" item-value="_id" multiple />
					<div class="text-overline">emergency message</div>
					<v-select v-model="alert.message" :items="store.settings.emergencyContact.messages" item-title="title" item-value="_id" />
					<div class="text-overline">time to send message</div>
					<div class="d-flex">
						<flat-pickr @onOpen="persistent = true" @onClose="persistent = false" style="min-width: 150px" ref="calendar" v-model="alert.sendAt" :config="flatPickrConfig" placeholder="Select time" name="time" />
						<div class="ml-4">({{ timeFromNow }})</div>
					</div>
				</div>
				<div class="mt-8">You just need to click "Okay" and you're all set. Remember to cancel this emergency alert after you safely arrive back from your meetup.</div>
			</v-card-text>
			<v-card-actions class="d-flex justify-center">
				<v-btn color="green" :variant="success ? 'tonal' : 'text'" :disabled="!store.settings.emergencyContact.contacts.length" :append-icon="success ? 'check' : undefined" variant="tonal" rounded block @click="setupHandler">Okay</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<style scoped>
.active-list-item {
	background-color: #ffecb3;
	border-radius: 24px;
}

.active-list-item.success {
	background-color: green;
}
</style>
<script setup>
import { ref, watch, computed } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import flatPickr from 'vue-flatpickr-component'
import humanizeDuration from 'humanize-duration'
import 'flatpickr/dist/flatpickr.css'

const flatPickrConfig = ref({
	enableTime: true,
	dateFormat: 'F j, Y h:i K',
	disable: [
		{
			from: new Date(264330300000),
			to: new Date(Date.now() + 3_660_000),
		},
	],
    minDate: new Date(Date.now() + 3_660_000)
})
const store = useAppStore()
const props = defineProps({
	modelValue: Boolean,
	created: Boolean,
	deleted: Boolean,
	adURL: String,
})
const emit = defineEmits(['update:modelValue', 'create:alert', 'close'])
const { smAndDown } = useDisplay()
const persistent = ref(false)
const alert = ref({
	from: store.settings.profile.name,
	to: store.settings.emergencyContact.contacts.map(contact => contact._id),
	message: store.settings.emergencyContact.messages[0]?._id,
	sendAt: new Date(Date.now() + (3 * 3_600_000)),
})
const calendar = ref('calendar')
const dialog = ref(props.modelValue)
const success = ref(false)
const loading = ref(false)
const timeFromNow = computed(() => humanizeDuration(Date.now() - Date.parse(alert.value.sendAt), { units: ['h', 'm'], round: true }))
watch(
	() => props.created,
	value => {
		if (value) {
			success.value = true
			reset()
		}
	}
)
watch(
	() => props.deleted,
	() => {
		success.value = true
		reset()
	}
)
watch(
	() => dialog,
	value => emit('update:modelValue', value)
)
watch(
	() => props.modelValue,
	value => (dialog.value = value)
)
const setupHandler = () => {
	if (success.value) return
	loading.value = true
	emit('create:alert', alert.value)
	setTimeout(() => {
		success.value = false
		loading.value = false
	}, 5000)
}
function reset() {
	setTimeout(() => {
		emit('close')
		success.value = false
		loading.value = false
	}, 500)
}
</script>
