<template>
	<v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
		<nav-header @changeTheme="$emit('changeTheme')" v-model="location" />
		<v-card v-if="contact" rounded="xl" class="mt-2" :class="smAndDown ? 'pa-0' : 'pa-4'" :elevation="0" :width="smAndDown ? '-webkit-fill-available' : '800px'">
			<v-card-title class="text-center">
				<span class="font-weight-bold">Emergency Contact Confirmed</span>
			</v-card-title>
			<v-card-subtitle class="text-center">Thank you <span class="text-capitalize">{{ contact.relationship }}</span></v-card-subtitle>
			<v-card-text class="text-center">
				<v-alert type="success" variant="tonal" class="mb-4">You are now confirmed as an emergency contact for {{ contact.owner.name }}</v-alert>
                <p class="text-start text-h6 text-capitalize mb-4 mt-8">Dear {{ contact.relationship }},</p>
				<p class="text-start text-body-1">This message confirms that you are now officially listed as an emergency contact for <span class="text-amber">{{ contact.owner.name }}</span>. While we hope such situations never arise, knowing that you are available to assist in case of an emergency provides peace of mind.</p>
				<p class="text-start text-body-1 my-4">
					In the unfortunate event of an emergency, you will receive a prescribed message from <span class="text-amber">{{ contact.owner.name }}</span> to help coordinate any necessary actions or provide support. Your role as an emergency contact is essential, and your dedication to this responsibility is commendable.
				</p>
				<p class="text-start text-body-1 my-4">Once again, thank you for being there when it matters most.</p>
				<p class="text-start text-body-1 my-4">Sincerely,</p>

				<div class="text-start font-italic text-h6 font-weight">The Clippings Team</div>
			</v-card-text>
		</v-card>
		<v-spacer />
	</v-container>
</template>

<script setup>
import io from 'socket.io-client'
import { ref, onMounted, computed, getCurrentInstance } from 'vue'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import { useAppStore } from '@/store/app'
import cookie from 'cookie'

import NavHeader from '@/components/NavHeader.vue'

const { $api } = getCurrentInstance().appContext.config.globalProperties
const store = useAppStore()
const location = ref({})
const { VITE_API_SERVER } = import.meta.env
const code = computed(() => location.value.pathname?.split('/')?.[2])
const contact = ref()
const { smAndDown } = useDisplay()

const sio = io(VITE_API_SERVER + '/', {
	transports: ['websocket'],
})
	.on('connect_error', error => {
		console.log('CALLBACK ERROR: ' + error)
	})
	.on('error', reason => {
		console.log(reason)
	})
	.on('connect', () => {
		sio.emit('optIn', { code: code.value }, payload => {
			contact.value = payload
		})
	})

onMounted(() => {
	if (!store.sessionId) {
		;(async () => {
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
