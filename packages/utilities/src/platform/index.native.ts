import { Platform } from 'react-native'

// Platform
export const isWeb: boolean = false
export const isAndroid: boolean = Platform.OS === 'android'
export const isIOS: boolean = Platform.OS === 'ios'
export const isMobile: boolean = true

export const isWebIOS: boolean = false
export const isWebAndroid: boolean = false

// Capability
export const isTouchable: boolean = true

// Browser
export const isChrome: boolean = false
export const isSafari: boolean = false
export const isMobileWebSafari: boolean = false
export const isMobileWebAndroid: boolean = false

// App
export const isExtension: boolean = false
export const isMobileApp: boolean = true
export const isInterface: boolean = false
