import { Platform } from 'react-native'

// Platform
export const isAndroid: boolean = Platform.OS === 'android'
export const isIOS: boolean = Platform.OS === 'ios'

export const isWebPlatform: boolean = false
export const isMobileWeb: boolean = false

export const isWebIOS: boolean = false
export const isWebAndroid: boolean = false

// Capability
export const isTouchable: boolean = true
export const isHoverable: boolean = false

// Browser
export const isChrome: boolean = false
export const isSafari: boolean = false
export const isMobileWebSafari: boolean = false
export const isMobileWebAndroid: boolean = false

// Environment
export const isBrowser: boolean = false

// App
export const isExtensionApp: boolean = false
export const isMobileApp: boolean = true
export const isWebApp: boolean = false
export const isInterfaceDesktop: boolean = false
