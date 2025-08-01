<template>
	<v-dialog no-click-animation :retain-focus="false" v-model="dialog" @update:model-value="$emit('update:modelValue', dialog)" :scrim="connected">
		<v-sheet width="1920" min-height="1080" height="1080" class="mx-auto" style="position: relative">
            <div style="position: absolute; top: 12px; right: 50px" class="text-caption text-end mr-2 animate__animated" :class="connected ? 'animate__fadeIn' : 'animate__fadeOut'">{{ vncUrl }}</div>
            <div ref="vncContainer" class="vnc-screen"></div>
            <v-sheet color="black" class="font-weight-bold text-center text-white animate__animated pa-4" :class="connected ? 'animate__fadeIn' : 'animate__fadeOut'">Please complete the captcha to finish the archiving process.</v-sheet>
        </v-sheet>
	</v-dialog>
</template>

<style scoped>
.vnc-screen {
	background: black;
    height: 1080px;
    width: 1920px;
	overflow: auto;
}
</style>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import RFB from '@novnc/novnc'

const props = defineProps({
	modelValue: Boolean,
	width: {
		type: [String, Number],
		default: 'auto',
	},
	minWidth: [String, Number],
	maxWidth: [String, Number],
	vncUrl: String,
})
const dialog = ref(props.modelValue)
const emit = defineEmits(['update:modelValue', 'close'])
const vncContainer = ref()
const connected = ref(false)
let rfb

function connect() {
	console.log('connecting...')
	try {
		if (!vncContainer.value) throw new Error('VNC container not mounted.')

		rfb = new RFB(vncContainer.value, props.vncUrl, {
			credentials: { username: '', password: '' },
			scaleViewport: true, // scale the canvas to container size
			resizeSession: false, // keep remote desktop size fixed (no resize)
			shared: true,
			viewOnly: false,
			qualityLevel: 1,
			reconnect: true,
		})

		rfb.addEventListener('connect', () => {
			console.log('✅ VNC connected')
			connected.value = true
		})

		rfb.addEventListener('disconnect', () => {
			console.log('🔌 VNC disconnected')
			connected.value = false
		})
	} catch (err) {
		console.error('Error while connecting VNC:', err)
		connected.value = false
	}
}

function disconnect() {
	if (rfb !== undefined) {
		rfb.disconnect()
		rfb = undefined
		connected.value = false
		emit('close')
	}
}

onMounted(() => {
	watch(
		() => props.modelValue,
		isOpen => {
			dialog.value = isOpen

			if (isOpen) {
				nextTick(() => {
					// Defer one more frame so layout is complete
					requestAnimationFrame(() => {
						connect()
					})
				})
			} else {
				console.log('disconnecting...')
				nextTick(disconnect)
			}
		},
		{ immediate: true }
	)
})

onBeforeUnmount(() => {
	disconnect()
})
</script>
