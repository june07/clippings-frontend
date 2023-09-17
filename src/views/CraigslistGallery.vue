<template>
    <v-container class="h-100 d-flex align-center flex-column" fluid>
        <v-btn variant="text" @click="dialog = true" class="text-body-2" prepend-icon="add">add a new search</v-btn>
        <v-sheet width="100%" v-for="(search, searchIndex) of store.clSearches">
            <audio :id="`sound-${search.url}`">
                <source v-if="sounds[search.url]" :src="sounds[search.url]" type="audio/mpeg">
            </audio>
            <v-row class="d-flex align-center">
                <v-col :cols="3" class="d-flex">
                    <div class="text-caption text-no-wrap text-truncate" style="cursor: pointer" v-if="!editing[search.url]" @click="editing[search.url] = true">{{ search.name }}</div>
                    <v-text-field variant="outlined" density="compact" hide-details v-model="newSearchName" v-else @change="setSearchNameModel(search.url)" placeholder="Search Name" />
                    <div v-if="data[search.url]?.checked" class="text-caption ml-8">last checked {{ checked[search.url] }} ago</div>
                    <v-spacer />
                </v-col>
                <v-spacer />
                <v-btn v-if="searchIndex !== 0" variant="text" class="text-body-2" icon="arrow_upward" @click="sort('up', search.url)" />
                <v-btn v-if="searchIndex !== store.clSearches.length - 1" variant="text" class="text-body-2" icon="arrow_downward" @click="sort('down', search.url)" />
                <v-btn variant="text" class="text-body-2" prepend-icon="delete" @click="deleteHandler(search.url)">delete <span class="ml-2 font-italic font-weight-medium">{{ search.name }}</span></v-btn>
            </v-row>
            <v-slide-group v-model="slidegroups[search.url]" class="pa-4" selected-class="bg-success" :class="hovering[search.url] ? '' : 'hide-arrows'" @mouseenter="hovering[search.url] = true" @mouseleave="hovering[search.url] = false">
                <v-slide-group-item v-for="(listing, index) of mostRecent(search.url)" :key="listing.pid" v-slot="{ isSelected, toggle, selectedClass }">
                    <div class="d-flex flex-column mx-1" style="width: 250px">
                        <v-icon class="new-icon" icon="newspaper" v-if="listing.time > Math.floor((Date.now() - (60000 * 10)) / 1000)" color="yellow" />
                        <v-card :color="listing.imageUrls?.length ? 'yellow-lighten-1' : 'grey-lighten-3'" rounded="xl">
                            <v-carousel transition="fade" height="250" hide-delimiter-background :show-arrows="false">
                                <span style="position: absolute; z-index: 1" class="text-caption ml-4">{{ listing.pid }}</span>
                                <v-carousel-item v-if="listing.imageUrls?.length" v-for="imageUrl of listing.imageUrls" :key="imageUrl">
                                    <v-img height="250" width="250" :src="imageUrl" cover style="border-radius: 12px" />
                                </v-carousel-item>
                                <div class="d-flex justify-center align-center text-caption h-100" v-else>
                                    No image
                                </div>
                            </v-carousel>
                        </v-card>
                        <a class="text-body-2 text-truncate" :href="listing.href" target="_blank">{{ listing.title }}</a>
                        <div class="text-caption text-truncate">{{ listing.meta.join(' ') }}</div>
                    </div>
                </v-slide-group-item>
            </v-slide-group>
        </v-sheet>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="700" v-model="dialog">
            <v-card rounded="xl" class="pa-4" style="opacity: 0.96">
                <v-card-title class="font-weight-light text-center">Add a new search</v-card-title>
                <v-card-subtitle class="font-weight-light text-center">Go ahead, do it!</v-card-subtitle>
                <v-card-text>
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newName" persistent-hint hint="name" placeholder="Any name you want" class="mb-4" />
                    <v-text-field density="compact" variant="solo" rounded="lg" v-model="newUrl" persistent-hint hint="url" placeholder="Any Craigslist search URL" :rules="rules.url" />
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn prepend-icon="add" variant="tonal" @click="newSearchHandler">add</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
<style scoped>
.new-icon {
    position: absolute;
    z-index: 1;
    top: 36px;
    left: 36px;
}

:deep() .hide-arrows .v-slide-group__prev,
:deep() .hide-arrows .v-slide-group__next {
    display: none;
}
</style>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import * as cheerio from 'cheerio'
import prettyMilliseconds from 'pretty-ms'
import { VSlideGroup } from 'vuetify/components/VSlideGroup'
import draggable from 'vuedraggable'

const rules = {
    url: [
        (v) => !!v || `url is required.`,
        v => v && /https:\/\/.*\.craigslist\.org\/search\/.+/.test(v) || `url is not valid or not supported`
    ]
}
const isMounted = ref(false)
const audioDebounce = ref()
const interval = ref()
const checked = ref({})
const hovering = ref({})
const editing = ref({})
const sounds = ref({})
const newName = ref()
const newSearchName = ref()
const newUrl = ref()
const dialog = ref(false)
const store = useAppStore()
const slidegroups = computed(() => store.clSearches.reduce((slidegroups, search) => ({ ...slidegroups, [search.url]: {} }), {}))
const maxListingsPerSearch = 7
const data = ref({})
const ws = io(import.meta.env.VITE_API_SERVER + '/cl', {
    transports: ['websocket'],
    path: '/ws',
    query: {}
})
    .on('connect_error', (error) => {
        console.log('CALLBACK ERROR: ' + error)
    })
    .on('error', reason => {
        console.log(reason)
    })

const { smAndDown } = useDisplay()

function sort(direction, url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        const search = store.clSearches.splice(index, 1).pop()
        store.clSearches.splice(direction === 'up' ? index - 1 : index, 0, search)
    }
}
function newSearchHandler() {
    store.clSearches.push({ name: newName.value || new Date().toLocaleString(), url: newUrl.value })
    ws.emit('get', newUrl.value, (result) => {
        if (!result) return
        parse(result)
    })
    dialog.value = false
}
function deleteHandler(url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        store.clSearches.splice(index, 1)
        ws.emit('delete', url)
    }
}
function setSearchNameModel(url) {
    const index = store.clSearches.findIndex(search => search.url === url)
    if (index !== -1) {
        store.clSearches[index].name = newSearchName.value
    }
    editing.value[url] = false
}
function estimateTimestampFromRelativeTime(relativeTime) {
    if (!relativeTime) return
    // Check for "N h ago" format
    const hoursAgoMatch = relativeTime.match(/^(\d+)\s*h\s+ago$/)
    if (hoursAgoMatch) {
        const hoursAgo = parseInt(hoursAgoMatch[1], 10)
        const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
        const estimatedTimestamp = currentTimestamp - hoursAgo * 3600 // Subtract hours in seconds
        return estimatedTimestamp
    }

    const minutessAgoMatch = relativeTime.match(/^(\d+)\s*mins\s+ago$/)
    if (minutessAgoMatch) {
        const minutessAgo = parseInt(minutessAgoMatch[1], 10)
        const currentTimestamp = Math.floor(Date.now() / 1000) // Current Unix timestamp in seconds
        const estimatedTimestamp = currentTimestamp - minutessAgo * 60 // Subtract hours in seconds
        return estimatedTimestamp
    }

    // Check for "M/D" format (month/day)
    const dateMatch = relativeTime.match(/^(\d+)\/(\d+)$/)
    if (dateMatch) {
        const month = parseInt(dateMatch[1], 10)
        const day = parseInt(dateMatch[2], 10)

        // Assuming the year is the current year
        const currentYear = new Date().getFullYear()
        const estimatedTimestamp = Math.floor(
            new Date(currentYear, month - 1, day).getTime() / 1000
        ) // Convert to Unix timestamp
        return estimatedTimestamp
    }

    return null // Return null if the format doesn't match
}

function mostRecent(url) {
    const sorted = data.value[url]?.listings ? Object.values(data.value[url].listings).sort((a, b) => a.time > b.time ? -1 : 0) : []
    const mostRecent = sorted.length ? sorted.slice(0, maxListingsPerSearch) : []
    return mostRecent
}
function parse(result) {
    const { url, html } = result
    hovering.value[url] = false
    editing.value[url] = false
    const $ = cheerio.load(html)
    const $searchResults = $('li.cl-search-result')

    if (!data.value[url]) data.value[url] = {
        url,
        listings: {}
    }
    data.value[url].checked = Date.now()
    sounds.value[url] = '/323208_4347097-lq.mp3'
    $searchResults.each((index, element) => {
        const pid = $(element).attr('data-pid')
        if (!data.value[url].listings[pid]) {
            if (isMounted.value) {
                if (audioDebounce.value) clearTimeout(audioDebounce.value)
                audioDebounce.value = setTimeout(() => {
                    document.getElementById(`sound-${url}`).play()
                    audioDebounce.value = undefined
                }, 3000)
            }
            data.value[url].listings[pid] = {
                pid,
                imageUrls: []
            }
        }
        $(element).find('.gallery-inner img').each((index, element) => {
            const imageUrl = $(element).attr('src')
            if (imageUrl) {
                data.value[url].listings[pid].imageUrls = Array.from(new Set([...data.value[url].listings[pid].imageUrls, imageUrl]))
            }
        })
        data.value[url].listings[pid].href = $(element).find('.posting-title').attr('href')
        data.value[url].listings[pid].title = $(element).find('.cl-app-anchor .label').text()
        data.value[url].listings[pid].meta = $(element).find('.meta').text().split($(element).find('.separator').text())
        data.value[url].listings[pid].time = estimateTimestampFromRelativeTime(data.value[url].listings[pid].meta[0])
    })
    if (interval.value) clearInterval(interval.value)
    interval.value = setInterval(() => {
        if (data.value && Object.keys(data.value).length) {
            Object.values(data.value).forEach(listing => {
                checked.value[listing.url] = prettyMilliseconds(Date.now() - data.value[listing.url].checked, { compact: true })
            })

        }
    }, 1000)
}
onMounted(() => {
    ws.on('update', (result) => parse(result))
    store.clSearches.forEach(search => {
        ws.emit('get', search.url, (result) => {
            if (!result) return
            parse(result)
        })
    })
    setTimeout(() => isMounted.value = true, 11000)
})
onBeforeUnmount(() => clearInterval(interval.value))
</script>
