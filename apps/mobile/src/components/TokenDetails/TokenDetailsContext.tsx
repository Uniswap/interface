import { type PlainMessage } from '@bufbuild/protobuf'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import { SharedEventName } from '@uniswap/analytics-events'
import type { GetTokenMultiChainResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { Platform, UniverseChainId } from '@universe/chains'
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppStackParamList } from 'src/app/navigation/types'
import {
  MultichainTokenDeployment,
  multichainTokensFromAddresses,
} from 'src/components/TokenDetails/multichainTokensFromAddresses'
import { useTokenDetailsColors } from 'src/components/TokenDetails/useTokenDetailsColors'
import { getGetTokenMultiChainQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { setHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/slice'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

type TokenDetailsContextState = {
  currencyId: string
  navigation: NativeStackNavigationProp<AppStackParamList, MobileScreens.TokenDetails, undefined>
  address: Address
  chainId: UniverseChainId
  currencyInfo?: CurrencyInfo
  multichainTokens: MultichainTokenDeployment[]
  hasMultichainAddresses: boolean
  initialIsMultichainAsset: boolean
  tokenColor: string | null
  tokenColorLoading: boolean
  isChainEnabled: boolean
  activeTransactionType?: CurrencyField
  setActiveTransactionType: (activeTransactionType: CurrencyField | undefined) => void
  isTokenWarningModalOpen: boolean
  openTokenWarningModal: () => void
  closeTokenWarningModal: () => void
  isContractAddressExplainerModalOpen: boolean
  openContractAddressExplainerModal: () => void
  closeContractAddressExplainerModal: (markViewed: boolean) => void
  isMultichainAddressSheetOpen: boolean
  openMultichainAddressSheet: () => void
  closeMultichainAddressSheet: () => void
  copyAddressToClipboard: (address: string) => Promise<void>
  isPermissioned: boolean
  isAllowlisted: boolean
  isPermissionedLoading: boolean
  permissionedIssuer: string | undefined
}

const TokenDetailsContext = createContext<TokenDetailsContextState | undefined>(undefined)

function selectMultichainAddresses(
  data: PlainMessage<GetTokenMultiChainResponse> | undefined,
): Record<string, string> | undefined {
  return data?.token?.addresses
}

export function TokenDetailsContextProvider({
  children,
  currencyId,
  navigation,
  initialIsMultichainAsset = false,
}: PropsWithChildren<
  Pick<TokenDetailsContextState, 'currencyId' | 'navigation'> & { initialIsMultichainAsset?: boolean }
>): JSX.Element {
  const dispatch = useDispatch()
  const trace = useTrace()

  const [isTokenWarningModalOpen, setIsTokenWarningModalOpen] = useState(false)
  const openTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(true), [])
  const closeTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(false), [])

  const [isContractAddressExplainerModalOpen, setIsContractAddressExplainerModalOpen] = useState(false)
  const openContractAddressExplainerModal = useCallback(() => setIsContractAddressExplainerModalOpen(true), [])

  const {
    value: isMultichainAddressSheetOpen,
    setTrue: openMultichainAddressSheet,
    setFalse: closeMultichainAddressSheet,
  } = useBooleanState(false)

  const closeContractAddressExplainerModal = useCallback(
    (markViewed: boolean) => {
      if (markViewed) {
        dispatch(setHasViewedContractAddressExplainer(true))
      }
      setIsContractAddressExplainerModalOpen(false)
    },
    [dispatch],
  )

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
      const copiedChainId = currencyIdToChain(currencyId)
      if (copiedChainId) {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          ...trace,
          element: ElementName.CopyAddress,
          chain_name: getChainInfo(copiedChainId).urlParam,
        })
      }
    },
    [currencyId, dispatch, trace],
  )

  // Set if attempting to buy or sell, used for token warning modal.
  const [activeTransactionType, setActiveTransactionType] = useState<CurrencyField | undefined>(undefined)

  const currencyInfo = useCurrencyInfo(currencyId) ?? undefined

  const { tokenColor, tokenColorLoading } = useTokenDetailsColors({ currencyId })

  const { chains: enabledChains } = useEnabledChains({ platform: Platform.EVM })

  const activeAddress = useActiveAccountAddressWithThrow()
  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToAddress(currencyId)

  const multichainParams = useMemo(
    () => ({ identifier: { case: 'token' as const, value: currencyIdToRestContractInput(currencyId) } }),
    [currencyId],
  )
  const { data: allMultichainAddresses } = useQuery(
    getGetTokenMultiChainQueryOptions({ params: multichainParams, select: selectMultichainAddresses }),
  )

  const multichainTokens = useMemo((): MultichainTokenDeployment[] => {
    if (!allMultichainAddresses) {
      // When null, this throws before being used
      return [{ chainId: chainId ?? UniverseChainId.Mainnet, address }]
    }
    return multichainTokensFromAddresses({ addresses: allMultichainAddresses, enabledChains })
  }, [allMultichainAddresses, enabledChains, address, chainId])

  const {
    isPermissioned: permissioned,
    isAllowlisted: allowlisted,
    isLoading: isPermissionedLoading,
    issuer: permissionedIssuer,
  } = useTokenKYCStatus({
    tokenAddress: address,
    chainId: chainId ?? undefined,
    walletAddress: activeAddress,
  })

  const state = useMemo<TokenDetailsContextState>((): TokenDetailsContextState => {
    if (!chainId) {
      throw new Error(`Unable to find chainId for currencyId: ${currencyId}`)
    }

    const isChainEnabled = !!enabledChains.find((_chainId) => _chainId === chainId)

    return {
      currencyId,
      navigation,
      address,
      chainId,
      currencyInfo,
      multichainTokens,
      hasMultichainAddresses: multichainTokens.length > 1,
      initialIsMultichainAsset,
      tokenColor,
      tokenColorLoading,
      isChainEnabled,
      activeTransactionType,
      setActiveTransactionType,
      isTokenWarningModalOpen,
      openTokenWarningModal,
      closeTokenWarningModal,
      isContractAddressExplainerModalOpen,
      openContractAddressExplainerModal,
      closeContractAddressExplainerModal,
      isMultichainAddressSheetOpen,
      openMultichainAddressSheet,
      closeMultichainAddressSheet,
      copyAddressToClipboard,
      isPermissioned: permissioned,
      isAllowlisted: allowlisted,
      isPermissionedLoading,
      permissionedIssuer,
    }
  }, [
    activeTransactionType,
    closeTokenWarningModal,
    closeContractAddressExplainerModal,
    closeMultichainAddressSheet,
    currencyId,
    currencyInfo,
    enabledChains,
    multichainTokens,
    initialIsMultichainAsset,
    isContractAddressExplainerModalOpen,
    isMultichainAddressSheetOpen,
    isTokenWarningModalOpen,
    navigation,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    openTokenWarningModal,
    tokenColor,
    tokenColorLoading,
    copyAddressToClipboard,
    permissioned,
    allowlisted,
    isPermissionedLoading,
    permissionedIssuer,
    address,
    chainId,
  ])

  return <TokenDetailsContext.Provider value={state}>{children}</TokenDetailsContext.Provider>
}

export const useTokenDetailsContext = (): TokenDetailsContextState => {
  const context = useContext(TokenDetailsContext)

  if (context === undefined) {
    throw new Error('`useTokenDetailsContext` must be used inside of `TokenDetailsContextProvider`')
  }

  return context
}
