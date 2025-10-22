import { Contract, ContractInterface, providers } from 'ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export class ContractManager {
  private _contracts: Partial<Record<UniverseChainId, Record<string, Contract>>> = {}

  createContract({
    chainId,
    address,
    provider,
    ABI,
  }: {
    chainId: UniverseChainId
    address: Address
    provider: providers.Provider
    ABI: ContractInterface
  }): Contract {
    if (isNativeCurrencyAddress(chainId, address) || !getValidAddress({ address, chainId, withEVMChecksum: true })) {
      throw Error(`Invalid address for contract: ${address}`)
    }
    this._contracts[chainId] ??= {}
    if (this._contracts[chainId]?.[address]) {
      throw new Error(`Contract already exists for: ${chainId} ${address}`)
    } else {
      logger.debug('ContractManager', 'createContract', `Creating a new contract for: ${chainId} ${address}`)
      const contract = new Contract(address, ABI, provider)
      // biome-ignore lint/style/noNonNullAssertion: Safe assertion - we just created this chainId key above
      this._contracts[chainId]![address] = contract
      return contract
    }
  }

  removeContract(chainId: UniverseChainId, address: Address): void {
    if (!this._contracts[chainId]?.[address]) {
      logger.warn(
        'ContractManager',
        'removeContract',
        `Attempting to remove non-existing contract for: ${chainId} ${address}`,
      )
      return
    }
    // biome-ignore lint/style/noNonNullAssertion: Safe assertion - we checked above that it does exist
    delete this._contracts[chainId]![address]
  }

  reset(): void {
    this._contracts = {}
  }

  // Returns contract or null
  getContract<T extends Contract>(chainId: UniverseChainId, address: Address): Nullable<T> {
    return (this._contracts[chainId]?.[address] as T | undefined) ?? null
  }

  getOrCreateContract<T extends Contract = Contract>({
    chainId,
    address,
    provider,
    ABI,
  }: {
    chainId: UniverseChainId
    address: Address
    provider: providers.Provider
    ABI: ContractInterface
  }): T {
    const cachedContract = this.getContract<T>(chainId, address)
    return (cachedContract ?? this.createContract({ chainId, address, provider, ABI })) as T
  }
}
