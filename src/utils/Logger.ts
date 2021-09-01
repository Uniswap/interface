import ReactGA from 'react-ga'

const isDev = process.env.NODE_ENV === 'development'

class Logger {
  error = (message: string) => {
    if (isDev) {
      console.error(message)
    }

    ReactGA.exception({
      message,
    })
  }
}

export default new Logger()
