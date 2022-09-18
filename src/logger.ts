class Logger {
    info (...messages: any) {
        console.info(new Date().toLocaleString(),':', ...messages)
    }

    error (...messages: any) {
        console.error(new Date().toLocaleString(), ':', ...messages)
    }
}

const logger = new Logger()

export default logger
