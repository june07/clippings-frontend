self.addEventListener('fetch', event => {
    // Intercept the fetch event to handle URL sharing
    if (event.request.method === 'POST' && event.request.url.includes('/share')) {
        event.respondWith(handleShareUrl(event.request))
    }
})

async function handleShareUrl(request) {
    const formData = await request.formData()
    const title = formData.get('title')
    const text = formData.get('text')
    const url = formData.get('url')

    // Redirect to the Vue "/share/" page
    const redirectUrl = new URL(`/#share&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, self.location.origin)
    const redirectResponse = new Response(redirectUrl.href, { status: 303, headers: { 'Location': redirectUrl.href } })
    console.log(redirectUrl)
    return redirectResponse
}
