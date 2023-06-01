import { UAParser } from 'ua-parser-js'

const parser = new UAParser(window.navigator.userAgent)
const { type } = parser.getDevice()
const { name } = parser.getBrowser()

export const isMobile = type === 'mobile' || type === 'tablet'
const platform = parser.getOS().name
export const isIOS = platform === 'iOS'
export const isNonIOSPhone = !isIOS && type === 'mobile'

export const isMobileSafari = isMobile && isIOS && name?.toLowerCase().includes('safari')
