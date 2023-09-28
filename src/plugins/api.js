import axios from "axios"

const { VITE_API_SERVER: API_SERVER, MODE } = import.meta.env

const axiosInstance = axios.create({
    headers: {
        "x-application": "june07-craigslist",
    },
    withCredentials: true
})

const apiService = () => {
    const request = async (passedOptions) => {
        const defaultOptions = {
            method: 'GET'
        }
        const options = {
            ...defaultOptions,
            ...passedOptions
        }

        try {
            const response = await axiosInstance(options)
            return options.returnResponse ? response : response.data
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data)
                console.log(error.response.status)
                console.log(error.response.headers)
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request)
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message)
            }
            console.log(error.config)
            throw error
        }
    }
    const authRequest = (options) => request({
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${options.token}`
        }
    })

    return {
        request,
        authRequest,
        buildInfo: async () => {
            if (MODE !== 'production' && !/dev\./.test(window.location.host)) {
                return
            }
            try {
                const { data } = await axiosInstance.get(`${window.origin}/build-info.json`, {
                    headers: {
                        'Cache-Control': 'no-store, max-age=0',
                    },
                })
                return data
            } catch (error) {
                console.error(error)
            }
        },
        info: () => request({ url: `${API_SERVER}/v1/info` }),
    }
}

export default {
    async install(app, options = { $auth: {} }) {
        const { $auth } = options
        app.config.globalProperties.$api = apiService(app, $auth)
    }
}