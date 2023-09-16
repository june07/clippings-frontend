<template>
    <v-container class="h-100 d-flex justify-center align-center flex-column" fluid>
        <v-btn @click="dialog = true">add</v-btn>
        <v-sheet width="100%" v-for="search of store.clSearches">
            <v-row>
                <v-col :cols="3">
                    <div class="text-caption text-no-wrap text-truncate" style="cursor: pointer" v-if="!editing[search.url]" @click="editing[search.url] = true">{{ search.name }}</div>
                    <v-text-field variant="outlined" density="compact" hide-details v-model="newSearchName" v-else @change="setSearchNameModel(search.url)" placeholder="Search Name" />
                    <v-spacer />
                </v-col>
            </v-row>
            <v-slide-group v-model="slidegroups[search.url]" class="pa-4" selected-class="bg-success" :class="hovering[search.url] ? '' : 'hide-arrows'" @mouseenter="hovering[search.url] = true" @mouseleave="hovering[search.url] = false">
                <v-slide-group-item v-for="(listing, index) of mostRecent(search.url)" :key="listing.pid" v-slot="{ isSelected, toggle, selectedClass }">
                    <div class="d-flex flex-column mx-1" style="width: 250px">
                        <v-carousel transition="fade" height="250" hide-delimiter-background :show-arrows="false">
                            <span style="position: absolute; z-index: 1" class="text-caption ml-4">{{ listing.pid }}</span>
                            <v-carousel-item v-if="listing.imageUrls?.length" v-for="imageUrl of listing.imageUrls" :key="imageUrl">
                                <v-img height="250" width="250" :src="imageUrl" cover style="border-radius: 12px" />
                            </v-carousel-item>
                            <div class="d-flex justify-center align-center text-caption h-100" v-else>
                                No image
                            </div>
                        </v-carousel>
                        <a class="text-body-2 text-truncate" :href="listing.href" target="_blank">{{ listing.title }}</a>
                        <div class="text-caption text-truncate">{{ listing.meta.join(' ') }}</div>
                    </div>
                </v-slide-group-item>
            </v-slide-group>
        </v-sheet>
        <v-dialog transition="dialog-bottom-transition" width="auto" min-width="400" v-model="dialog">
            <v-card rounded="xl">
                <v-card-title class="font-weight-light">Add a new search</v-card-title>
                <v-card-text>
                    <v-text-field variant="outlined" v-model="newName" persistent-hint hint="search name" placeholder="free stuff" />
                    <v-text-field variant="outlined" v-model="newUrl" persistent-hint hint="search url" />
                </v-card-text>
                <v-card-actions class="justify-center">
                    <v-btn @click="newSearchHandler">add</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>
<style scoped>
:deep() .hide-arrows .v-slide-group__prev, :deep() .hide-arrows .v-slide-group__next {
    display: none;
}
</style>
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAppStore } from '@/store/app'
import { useDisplay } from 'vuetify/lib/framework.mjs'
import io from 'socket.io-client'
import * as cheerio from 'cheerio'

const hovering = ref({})
const editing = ref({})
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

function newSearchHandler() {
    store.clSearches.push({ name: newName.value, url: newUrl.value })
    ws.emit('get', newUrl.value, (result) => {
        if (!result) return
        parse(result)
    })
    dialog.value = false
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
    const sorted = data.value[url]?.listings ? Object.values(data.value[url].listings).sort((a, b) => estimateTimestampFromRelativeTime(a.meta[0]) > estimateTimestampFromRelativeTime(b.meta[0]) ? -1 : 0) : []
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
        listings: {}
    }
    $searchResults.each((index, element) => {
        const pid = $(element).attr('data-pid')
        if (!data.value[url].listings[pid]) {
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
    })
}
onMounted(() => {
    ws.on('update', (result) => parse(result))
    store.clSearches.forEach(search => {
        ws.emit('get', search.url, (result) => {
            if (!result) return
            parse(result)
        })
    })
})
</script>
