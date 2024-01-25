import { UAParser } from 'ua-parser-js'

const parser = new UAParser(navigator.userAgent)
const { type } = parser.getDevice()
const { name } = parser.getBrowser()
const { name: platform } = parser.getOS()

export const isMobile = type === 'mobile' || type === 'tablet'
export const isIOS = platform === 'iOS'
export const isAndroid = platform === 'Android'
export const isNonSupportedDevice = !isIOS && !isAndroid && type === 'mobile'
export const isMobileSafari = isMobile && isIOS && name?.toLowerCase().includes('safari')
