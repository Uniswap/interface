import { Result } from 'ethers/lib/utils'
import { TransactionDescription } from 'no-yolo-signatures'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'

export function useTransactionCurrencies(args: {
  chainId?: UniverseChainId
  to?: string
  parsedTransactionData?: TransactionDescription
}): CurrencyInfo[] {
  const { chainId, to, parsedTransactionData } = args
  const addresses = parseAddressesFromArgData(parsedTransactionData?.args)

  const addressesFound = [...(to ? [to] : []), ...addresses]
  const currencyIdsInvolved = chainId ? addressesFound.map((address) => buildCurrencyId(chainId, address)) : []
  const currenciesInvolved = useTokenProjects(currencyIdsInvolved)
  const chainCurrencies = currenciesInvolved.data?.filter((c) => c.currency.chainId === chainId && !c.currency.isNative)

  return chainCurrencies || []
}

// recursively parse smart contract arguments and finds all addresses involved in a transaction
function parseAddressesFromArgData(args?: Result): string[] {
  const addresses: string[] = []

  args?.forEach((arg) => {
    if (Array.isArray(arg)) {
      parseAddressesFromArgData(arg)
    }

    if (typeof arg === 'string' && isEVMAddressWithChecksum(arg)) {
      if (!addresses.includes(arg)) {
        addresses.push(arg)
      }
    }
  })

  return addresses
}
