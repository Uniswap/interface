import { SPECIAL_CASE_TOKEN_COLORS } from 'ui/src/utils/colors/specialCaseTokens'

export function getSpecialCaseTokenColor(imageUrl: Maybe<string>, isDarkMode: boolean): Nullable<string> {
  if (imageUrl && blackAndWhiteSpecialCase.has(imageUrl)) {
    return isDarkMode ? '#FFFFFF' : '#000000'
  }

  if (!imageUrl || !SPECIAL_CASE_TOKEN_COLORS[imageUrl]) {
    return null
  }

  return SPECIAL_CASE_TOKEN_COLORS[imageUrl]
}

const blackAndWhiteSpecialCase: Set<string> = new Set([
  // QNT
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4a220E6096B25EADb88358cb44068A3248254675/logo.png',
  // Xen
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8/logo.png',
  // FWB
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x35bD01FC9d6D5D81CA9E055Db88Dc49aa2c699A8/logo.png',
])
