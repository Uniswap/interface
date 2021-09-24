import { utils } from 'ethers'
import { logger } from 'src/utils/logger'

export function isValidAddress(address: string) {
  // Need to catch because ethers' isAddress throws in some cases (bad checksum)
  try {
    const isValid = address && utils.isAddress(address)
    return !!isValid
  } catch (error) {
    logger.warn('Invalid address', error, address)
    return false
  }
}

export function validateAddress(address: string, context: string) {
  if (!isValidAddress(address)) {
    const errorMsg = `Invalid addresses for ${context}: ${address}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }
}

export function normalizeAddress(address: string) {
  validateAddress(address, 'normalize')
  return utils.getAddress(address)
}

export function shortenAddress(address: string, elipsis?: boolean, capitalize?: boolean) {
  validateAddress(address, 'shorten')
  const shortened = normalizeAddress(address).substr(0, 8) + (elipsis ? '...' : '')
  return capitalize ? capitalizeAddress(shortened) : shortened
}

export function capitalizeAddress(address: string) {
  return '0x' + address.substring(2).toUpperCase()
}

export function areAddressesEqual(a1: string, a2: string) {
  validateAddress(a1, 'compare')
  validateAddress(a2, 'compare')
  return utils.getAddress(a1) === utils.getAddress(a2)
}

export function trimLeading0x(input: string) {
  return input.startsWith('0x') ? input.substring(2) : input
}

export function ensureLeading0x(input: string) {
  return input.startsWith('0x') ? input : `0x${input}`
}
