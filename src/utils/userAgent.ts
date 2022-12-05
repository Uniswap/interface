import { UAParser } from 'ua-parser-js'

const parser = new UAParser(window.navigator.userAgent)
const { type } = parser.getDevice()

export const isMobile = type === 'mobile' || type === 'tablet'
