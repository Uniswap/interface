const isDev = process.env.NODE_ENV === 'development'

const config = {
  styledComponents: {
    fileName: isDev,
    displayName: isDev,
  },
}

export default config
