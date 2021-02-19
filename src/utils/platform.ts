import { SupportedPlatform } from 'dxswap-sdk'

export function getNameForSupportedPlatform(platform: SupportedPlatform): String {
    switch (platform) {
        case SupportedPlatform.SWAPR:
            return 'Swapr'
        case SupportedPlatform.UNISWAP:
            return 'Uniswap'
        case SupportedPlatform.SUSHISWAP:
            return 'Sushiswap'
        default:
            return 'Swapr'
    }
}
