import { parseEther } from 'ethers/lib/utils'
import { WalletConnectRequest } from 'src/features/walletConnect/walletConnectSlice'
import { AssetType } from 'uniswap/src/entities/assets'
import { DynamicConfigs, UwuLinkConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import {
  EthMethod,
  EthTransaction,
  UwULinkErc20SendRequest,
  UwULinkMethod,
  UwULinkRequest,
} from 'uniswap/src/types/walletConnect'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { getTokenSendRequest } from 'wallet/src/features/transactions/send/hooks/useSendTransactionRequest'
import { SendCurrencyParams } from 'wallet/src/features/transactions/send/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

// This type must match the format in statsig dynamic config for uwulink
// https://console.statsig.com/5HjUux4OvSGzgqWIfKFt8i/dynamic_configs/uwulink_config
type UwULinkAllowlistItem = {
  chainId: number
  address: string
  name: string
  logo?: {
    dark?: string
    light?: string
  }
}

type UwULinkAllowlist = {
  contracts: UwULinkAllowlistItem[]
  tokenRecipients: UwULinkAllowlistItem[]
}

const UWULINK_MAX_TXN_VALUE = '0.001'

export const UNISWAP_URL_SCHEME_UWU_LINK = 'uniswap://uwulink?'
export const UWULINK_PREFIX = 'uwulink' as const

// uwulink{...} format for uwulink direct link
export function isUwULinkDirectLink(uri: string): boolean {
  // Note the trailing `{` char is required for UwULink. See spec:
  // https://github.com/ethereum/EIPs/pull/7253/files#diff-ec1218463dc29af4f2826e540d30abe987ab4c5b7152e1f6c567a0f71938a293R30
  return uri.startsWith(`${UWULINK_PREFIX}{`)
}

// uniswap://uwulink?uwulink{...} format for uwulink deep link
export function isUwuLinkUniswapDeepLink(uri: string): boolean {
  return uri.startsWith(`${UNISWAP_URL_SCHEME_UWU_LINK}${UWULINK_PREFIX}`)
}

export function parseUwuLinkDataFromDeeplink(uri: string): string {
  return uri.slice(UNISWAP_URL_SCHEME_UWU_LINK.length + UWULINK_PREFIX.length).replaceAll('\\', '')
}

// Gets the UWULink contract allow list from statsig dynamic config.
// We can safely cast as long as the statsig config format matches our `UwuLinkAllowlist` type.
export function useUwuLinkContractAllowlist(): UwULinkAllowlist {
  return useDynamicConfigValue(
    DynamicConfigs.UwuLink,
    UwuLinkConfigKey.Allowlist,
    {
      contracts: [],
      tokenRecipients: [],
    },
    (x: unknown) => {
      const hasFields =
        x !== null && typeof x === 'object' && Object.hasOwn(x, 'contracts') && Object.hasOwn(x, 'tokenRecipients')

      if (!hasFields) {
        return false
      }

      const castedObj = x as { contracts: unknown; tokenRecipients: unknown }

      return Array.isArray(castedObj.contracts) && Array.isArray(castedObj.tokenRecipients)
    },
  )
}

function findAllowedTokenRecipientForUwuLink(
  request: UwULinkRequest,
  allowlist: UwULinkAllowlist,
): UwULinkAllowlistItem | undefined {
  if (request.method !== UwULinkMethod.Erc20Send) {
    return undefined
  }

  const { chainId, recipient } = request
  return allowlist.tokenRecipients.find(
    (item) => item.chainId === chainId && areAddressesEqual(item.address, recipient),
  )
}
/**
 * Util function to check if a UwULinkRequest is valid.
 *
 * Current testing conditions requires:
 * 1. The to address is in the UWULINK_CONTRACT_ALLOWLIST
 * 2. The value is less than or equal to UWULINK_MAX_TXN_VALUE
 *
 * TODO: also check for validity of the entire request object (e.g. all the required fields exist)
 *
 * @param request parsed UwULinkRequest
 * @returns boolean for whether the UwULinkRequest is allowed
 */
export function isAllowedUwuLinkRequest(request: UwULinkRequest, allowlist: UwULinkAllowlist): boolean {
  // token sends
  if (request.method === UwULinkMethod.Erc20Send) {
    return Boolean(findAllowedTokenRecipientForUwuLink(request, allowlist))
  }

  if (request.method === EthMethod.PersonalSign) {
    return true
  }

  // generic transactions
  const { to, value } = request.value
  const belowMaximumValue = !value || parseFloat(value) <= parseEther(UWULINK_MAX_TXN_VALUE).toNumber()
  const isAllowedContractAddress = to && allowlist.contracts.some((item) => areAddressesEqual(item.address, to))

  if (!belowMaximumValue || !isAllowedContractAddress) {
    return false
  }

  return true
}

type HandleUwuLinkRequestParams = {
  request: UwULinkRequest
  activeAccount: Account
  allowList: UwULinkAllowlist
  providerManager: ProviderManager
  contractManager: ContractManager
}

export async function getFormattedUwuLinkTxnRequest({
  request,
  activeAccount,
  allowList,
  providerManager,
  contractManager,
}: HandleUwuLinkRequestParams): Promise<{ request: WalletConnectRequest; account: string }> {
  const newRequest = {
    sessionId: UWULINK_PREFIX, // session/internalId is WalletConnect specific, but not needed here
    internalId: UWULINK_PREFIX,
    account: activeAccount?.address,
    dapp: {
      name: '',
      url: '',
      ...request.dapp,
      source: UWULINK_PREFIX,
      chain_id: request.chainId,
      webhook: request.webhook,
    },
    chainId: request.chainId,
  }

  if (request.method === EthMethod.PersonalSign) {
    return {
      account: activeAccount.address,
      request: {
        ...newRequest,
        type: EthMethod.PersonalSign,
        message: request.message,
        // rawMessage should be the hex version of `message`, but our wallet will only use
        // `message` if it exists. so this is mostly to appease Typescript
        rawMessage: request.message,
      },
    }
  } else if (request.method === UwULinkMethod.Erc20Send) {
    const preparedTransaction = await toTokenTransferRequest(request, activeAccount, providerManager, contractManager)
    const tokenRecipient = findAllowedTokenRecipientForUwuLink(request, allowList)
    return {
      account: activeAccount.address,
      request: {
        ...newRequest,
        type: UwULinkMethod.Erc20Send,
        recipient: {
          address: request.recipient,
          name: tokenRecipient?.name ?? '',
          logo: tokenRecipient?.logo,
        },
        amount: request.amount,
        tokenAddress: request.tokenAddress,
        isStablecoin: request.isStablecoin,
        transaction: {
          from: activeAccount.address,
          ...preparedTransaction,
        },
      },
    }
  }

  return {
    account: activeAccount.address,
    request: {
      ...newRequest,
      type: EthMethod.EthSendTransaction,
      transaction: {
        from: activeAccount.address,
        ...request.value,
      },
    },
  }
}

async function toTokenTransferRequest(
  request: UwULinkErc20SendRequest,
  account: Account,
  providerManager: ProviderManager,
  contractManager: ContractManager,
): Promise<EthTransaction> {
  const provider = providerManager.getProvider(request.chainId)
  const params: SendCurrencyParams = {
    type: AssetType.Currency,
    account,
    chainId: request.chainId,
    toAddress: request.recipient,
    tokenAddress: request.tokenAddress,
    amountInWei: request.amount.toString(),
  }
  const transaction = await getTokenSendRequest(params, provider, contractManager)
  return transaction as EthTransaction
}
