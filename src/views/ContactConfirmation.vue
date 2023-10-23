<template>
	<v-container class="h-100 d-flex align-center justify-center flex-column" fluid>
		<nav-header @changeTheme="$emit('changeTheme')" v-model="location" />
		<v-card v-if="contact" rounded="xl" class="mt-2" :class="smAndDown ? 'pa-0' : 'pa-4'" :elevation="0" :width="smAndDown ? '-webkit-fill-available' : '800px'">
			<v-card-title class="text-center">
				<span class="font-weight-bold">Emergency Contact Confirmed</span>
			</v-card-title>
			<v-card-subtitle class="text-center">Thank you {{ contact.relationship }}</v-card-subtitle>
			<v-card-text class="text-center">
                <v-alert type="success" variant="tonal" class="mb-4">You are now confirmed as an emergency contact for {{ contact.owner.name }}</v-alert>
                Hopefully they never come, but in the event of an emergency, you will receive a message on the behalf of {{ contact.owner.name }}
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
