// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exec } = require('child_process')
const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE)

if (isWindows) {
  exec(`type nul > src/locales/en-US.po`)
} else {
  exec(`touch src/locales/en-US.po`)
}
