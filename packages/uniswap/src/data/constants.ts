import DeviceInfo from 'react-native-device-info'
import { isAndroid, isExtension, isIOS, isMobile } from 'uniswap/src/utils/platform'

export const ROUTING_API_PATH = '/v2/quote'

export const REQUEST_SOURCE = isIOS ? 'uniswap-ios' : isAndroid ? 'uniswap-android' : 'uniswap-web'

export const getVersionHeader = (): string => {
  if (isMobile) {
    return DeviceInfo.getVersion()
  } else if (isExtension) {
    return process.env.VERSION ?? ''
  } else {
    // unimplemented for web
    return ''
  }
}
