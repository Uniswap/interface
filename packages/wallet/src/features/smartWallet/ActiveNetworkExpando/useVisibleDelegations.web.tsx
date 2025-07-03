import {
  UseVisibleDelegationsParams,
  UseVisibleDelegationsResult,
} from 'wallet/src/features/smartWallet/ActiveNetworkExpando/useVisibleDelegations'

export function useVisibleDelegations({ data, isOpen }: UseVisibleDelegationsParams): UseVisibleDelegationsResult {
  return { maxHeight: '100%', visibleItems: isOpen ? data : [] }
}
