import { utils } from 'ethers'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { logger } from 'src/utils/logger'
import { ensureLeading0x } from 'src/utils/string'

export enum AddressStringFormat {
  lowercase,
  uppercase,
  checksum,
  shortened,
}

export class Address {
  private constructor(readonly address: string) {}

  // Use this to instantiate new Addresses
  public static from(address: string) {
    if (!address || !utils.isAddress(address)) throw new Error(`Invalid address ${address}`)
    return new Address(utils.getAddress(ensureLeading0x(address)))
  }

  public static isValid(address: string | null | undefined, allowZero = true) {
    // Need to catch because ethers' isAddress throws in some cases (bad checksum)
    try {
      const isValid = address && utils.isAddress(address)
      if (allowZero) return !!isValid
      else return !!isValid && address !== NULL_ADDRESS
    } catch (error) {
      logger.warn('Invalid address', error, address)
      return false
    }
  }

  public static normalize(address: string | null | undefined) {
    if (!address || Address.isValid(address)) return null
    else return utils.getAddress(ensureLeading0x(address))
  }

  public toString(format = AddressStringFormat.checksum) {
    switch (format) {
      case AddressStringFormat.lowercase:
        return this.address.toLowerCase()
      case AddressStringFormat.uppercase:
        return this.address.toUpperCase()
      case AddressStringFormat.shortened:
        return this.address.substr(0, 8)
      case AddressStringFormat.checksum:
      default:
        return this.address
    }
  }

  public equals(address2: string | Address) {
    if (typeof address2 === 'string') {
      if (!Address.isValid(address2)) throw new Error(`Invalid address ${address2}`)
      return this.address === utils.getAddress(address2)
    } else {
      return this.address === address2.toString()
    }
  }
}
