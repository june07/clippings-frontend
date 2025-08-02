<template>
	<v-dialog no-click-animation :retain-focus="false" v-model="dialog" @update:model-value="$emit('update:modelValue', dialog)" :scrim="connected">
		<v-sheet :width="width" :min-height="height" :height="height" class="mx-auto" style="position: relative">
			<div v-if="!PROD" style="position: absolute; top: 12px; right: 50px" class="text-caption text-end mr-2 animate__animated" :class="connected ? 'animate__fadeIn' : 'animate__fadeOut'">{{ vncUrl }}</div>
			<div ref="vncContainer" :styleObj="styleObj" class="d-flex align-center justify-center"></div>
			<v-sheet color="black" class="font-weight-bold text-center text-white animate__animated pa-4 text-caption" :class="connected ? 'animate__fadeIn' : 'animate__fadeOut'">Please complete the captcha to finish archiving.</v-sheet>
			{{ console.log(rfbOptions) }}
		</v-sheet>
	</v-dialog>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import RFB from '@elikoga/novnc'

const { PROD } = import.meta.env
const { xs } = useDisplay()
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

const width = ref('100%')
const height = ref('100%')
const styleObj = computed(() => ({
	background: 'black',
	width: '100%',
	height: '100%',
	overflow: 'auto',
}))
const rfbOptions = computed(() => ({
	credentials: { username: '', password: '' },
	scaleViewport: true, // scale the canvas to container size
	resizeSession: xs.value, // keep remote desktop size fixed (no resize)
	shared: true,
	viewOnly: false,
	qualityLevel: 1,
	reconnect: true,
	fullscreen: xs.value,
}))

function connect() {
	console.log('connecting...')
	try {
		if (!vncContainer.value) throw new Error('VNC container not mounted.')

		rfb = new RFB(vncContainer.value, props.vncUrl, rfbOptions.value)

		rfb.addEventListener('connect', () => {
			console.log('✅ VNC connected')
			connected.value = true

			setTimeout(() => {
				rfb.scaleViewport = true
				rfb._updateDisplay?.() // internal method, safe to call
			}, 100)
		})

		rfb.addEventListener('disconnect', () => {
			console.log('🔌 VNC disconnected')
			nextTick(disconnect)
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
