import { GraphQLApi } from '@universe/api'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useFormattedTransactionDataForActivity } from 'uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useRestOnRampAuth } from 'wallet/src/features/activity/useRestOnRampAuth'
import { useAccounts, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { selectHasBalanceOrActivityForAddress } from 'wallet/src/features/wallet/selectors'
import { setHasBalanceOrActivity } from 'wallet/src/features/wallet/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

/**
 * This is the interval at which the NFTs tab will poll for new NFTs
 * when the wallet is empty. Both activity and balances are updated
 * in other parts of the app so we don't need to poll.
 */
const EMPTY_WALLET_NFT_POLL_INTERVAL = 15 * ONE_SECOND_MS

/**
 * Helper hook used to determine the state of the home screen such as whether the wallet should fetch
 * data to see if the wallet has been used which is used to determine what UI to show on the home screen
 * such as the explore view or the tabs
 */
export function useHomeScreenState(): {
  showEmptyWalletState: boolean
  isTabsDataLoaded: boolean
} {
  const dispatch = useDispatch()
  const { address } = useActiveAccountWithThrow()
  const ownerAddresses = Object.keys(useAccounts())
  const hasUsedWalletFromCache = useSelector((state: WalletState) =>
    selectHasBalanceOrActivityForAddress(state, address),
  )
  const { gqlChains } = useEnabledChains()

  const neverCached = hasUsedWalletFromCache === undefined

  // There's a race condition during onboarding where the editAccountSaga is
  // editing the account in redux in an unconventional way that causes the
  // hasUsedWalletFromCache to reset after being set by this hook. This ref
  // is a work around to only trigger the loading state once.
  const dataLoadedRef = useRef(false)

  const fiatOnRampParams = useRestOnRampAuth(address)

  const { data: balancesById, loading: areBalancesLoading } = usePortfolioBalances({
    evmAddress: address,
    skip: hasUsedWalletFromCache,
  })
  const { data: nftData, loading: areNFTsLoading } = GraphQLApi.useNftsTabQuery({
    variables: {
      ownerAddress: address,
      first: 1,
      filter: { filterSpam: true },
      chains: gqlChains,
    },
    pollInterval: EMPTY_WALLET_NFT_POLL_INTERVAL,
    notifyOnNetworkStatusChange: true, // Used to trigger network state / loading on refetch or fetchMore
    errorPolicy: 'all', // Suppress non-null image.url fields from backend
    skip: hasUsedWalletFromCache,
  })
  const { hasData: hasActivity, isLoading: isActivityLoading } = useFormattedTransactionDataForActivity({
    evmAddress: address,
    ownerAddresses,
    fiatOnRampParams,
    hideSpamTokens: true,
    pageSize: 1,
    skip: hasUsedWalletFromCache,
  })

  const hasNft = !!nftData?.nftBalances?.edges.length
  const hasTokenBalance = balancesById ? Object.keys(balancesById).length > 0 : false
  const hasUsedWalletFromRemote = hasTokenBalance || hasNft || hasActivity
  const dataIsLoading = areBalancesLoading || areNFTsLoading || isActivityLoading

  const isTabsDataLoaded = neverCached ? !dataIsLoading : true
  const hasUsedWallet = hasUsedWalletFromCache || hasUsedWalletFromRemote

  const shouldUpdateCache = neverCached && isTabsDataLoaded
  const addressIsNowUsed = hasUsedWalletFromCache === false && hasUsedWalletFromRemote
  useEffect(() => {
    if (shouldUpdateCache || addressIsNowUsed) {
      dispatch(setHasBalanceOrActivity({ address, hasBalanceOrActivity: hasUsedWallet }))
    }
  }, [hasUsedWallet, dispatch, address, shouldUpdateCache, addressIsNowUsed])

  if (!dataLoadedRef.current && isTabsDataLoaded) {
    dataLoadedRef.current = true
  }

  return {
    showEmptyWalletState: !hasUsedWallet,
    isTabsDataLoaded: dataLoadedRef.current || isTabsDataLoaded,
  }
}
