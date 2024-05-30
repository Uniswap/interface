import { isAddress, keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { UNICON_COLORS } from './Colors'

export const getUniconsV2DeterministicHash = (address: string): bigint => {
  if (!isValidEthAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }
  const hash = keccak256(toUtf8Bytes(address))
  const hashNumber = BigInt('0x' + hash.slice(2, 12))
  return hashNumber
}

const ETH_ADDRESS_LENGTH = 42 // Ethereum addresses are 42 characters long including '0x'
// TODO: move to a shared location in utilities or wallet package
export const isValidEthAddress = (address: string): boolean => {
  return Boolean(
    address.startsWith('0x') &&
      isAddress(address.toLowerCase()) &&
      address.length === ETH_ADDRESS_LENGTH
  )
}

export const getUniconV2Colors = (
  activeAddress: string,
  isDark: boolean = false
): {
  color: string
} => {
  const hashValue = getUniconsV2DeterministicHash(activeAddress)
  const colorIndex = isDark ? 1 : 0

  let colorToUse
  if (!isNaN(Number(hashValue.toString()))) {
    const colorArrayIndex = Number(hashValue.toString()) % Number(UNICON_COLORS.length)
    colorToUse = UNICON_COLORS[colorArrayIndex]?.[colorIndex]
  } else {
    colorToUse = UNICON_COLORS[0]?.[colorIndex]
  }

  return {
    color: (colorToUse || '#F50DB4').toString(),
  }
}
