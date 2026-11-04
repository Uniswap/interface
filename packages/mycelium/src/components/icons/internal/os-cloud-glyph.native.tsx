/** Native leg of `OSDynamicCloudIcon`'s glyph: iCloud on iOS, GoogleDrive on Android. */
import { Platform } from 'react-native'
import { Cloud } from '../Cloud'
import { GoogleDrive } from '../GoogleDrive'

export const OSCloudGlyph = Platform.OS === 'ios' ? Cloud : GoogleDrive
