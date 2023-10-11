class Clipboard {
    constructor() {
        this.debounce = false
    }
    async copy(data) {
        let self = this
        if (self.debounce) return
        self.debounce = true
        try {
            if (data instanceof Blob) {
                await navigator.clipboard.write([new ClipboardItem({ [data.type]: data })])
            } else {
                await navigator.clipboard.writeText(data)
            }
        } catch (error) {
            console.log({ error })
            self.debounce = false
        }
        setTimeout(() => {
            self.debounce = false
        }, 100)
    }
}

export default new Clipboard()