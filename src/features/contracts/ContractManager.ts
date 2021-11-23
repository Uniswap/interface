import { Contract, providers } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { isValidAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

export class ContractManager {
  private _contracts: Partial<Record<ChainId, Record<string, Contract>>> = {}

  createContract(chainId: ChainId, address: Address, provider: providers.Provider, ABI: any) {
    if (!isValidAddress(address, false)) {
      throw Error(`Invalid address for contract: ${address}`)
    }
    this._contracts[chainId] ??= {}
    if (this._contracts[chainId]![address]) {
      throw new Error(`Contract already exists for: ${chainId} ${address}`)
    } else {
      logger.debug(
        'ContractManager',
        'createContract',
        `Creating a new contract for: ${chainId} ${address}`
      )
      const contract = new Contract(address, ABI, provider)
      this._contracts[chainId]![address] = contract
      return contract
    }
  }

  removeContract(chainId: ChainId, address: Address) {
    if (!this._contracts[chainId]?.[address]) {
      logger.warn(
        'ContractManager',
        'removeContract',
        `Attempting to remove non-existing contract for: ${chainId} ${address}`
      )
      return
    }
    delete this._contracts[chainId]![address]
  }

  reset() {
    this._contracts = {}
  }

  // Returns contract or null
  getContract<T extends Contract>(chainId: ChainId, address: Address) {
    return (this._contracts[chainId]?.[address] as T | undefined) ?? null
  }

  getOrCreateContract<T extends Contract = Contract>(
    chainId: ChainId,
    address: Address,
    provider: providers.Provider,
    ABI: any
  ) {
    const cachedContract = this.getContract<T>(chainId, address)
    return (cachedContract ?? this.createContract(chainId, address, provider, ABI)) as T
  }
}
