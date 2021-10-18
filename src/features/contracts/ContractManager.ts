import { Contract, providers } from 'ethers'
import { SupportedChainId } from 'src/constants/chains'
import { Address } from 'src/utils/Address'
import { logger } from 'src/utils/logger'

export class ContractManager {
  private _contracts: Partial<Record<SupportedChainId, Record<string, Contract>>> = {}

  createContract(
    chainId: SupportedChainId,
    address: string,
    provider: providers.Provider,
    ABI: any
  ) {
    if (!Address.isValid(address, false)) {
      throw Error(`Invalid address for contract: ${address}`)
    }
    this._contracts[chainId] ??= {}
    if (this._contracts[chainId]![address]) {
      throw new Error(`Contract already exists for: ${chainId} ${address}`)
    } else {
      logger.debug(`Creating a new contract for: ${chainId} ${address} `)
      const contract = new Contract(address, ABI, provider)
      this._contracts[chainId]![address] = contract
      return contract
    }
  }

  removeContract(chainId: SupportedChainId, address: string) {
    if (!this._contracts[chainId]?.[address]) {
      logger.warn('Attempting to remove non-existing contract', chainId, address)
      return
    }
    delete this._contracts[chainId]![address]
  }

  reset() {
    this._contracts = {}
  }

  // Returns contract or null
  getContract(chainId: SupportedChainId, address: string) {
    return this._contracts[chainId]?.[address] ?? null
  }

  getOrCreateContract(
    chainId: SupportedChainId,
    address: string,
    provider: providers.Provider,
    ABI: any
  ) {
    const cachedContract = this.getContract(chainId, address)
    if (cachedContract) return cachedContract
    else return this.createContract(chainId, address, provider, ABI)
  }
}
