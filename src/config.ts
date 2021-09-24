interface Config {
  debug: boolean
  version: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configProd: Config = {
  debug: false,
  version: '0.0.1',
}

const configDev: Config = {
  debug: true,
  version: '0.0.1',
}

export const config = Object.freeze(configDev)
