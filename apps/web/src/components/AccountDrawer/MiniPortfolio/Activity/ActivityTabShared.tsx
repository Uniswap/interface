import { useQuery } from '@tanstack/react-query'
import { TradeType } from '@uniswap/sdk-core'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { signatureToActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { useUpdateAtom } from 'jotai/utils'
import { usePendingOrders } from 'state/signatures/hooks'
import { SignatureType } from 'state/signatures/types'
import { Flex, ScrollView } from 'ui/src'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const SIGNATURE_TYPE_TO_ROUTING_MAP: {
  [key in SignatureType]: Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY
} = {
  [SignatureType.SIGN_UNISWAPX_V2_ORDER]: Routing.DUTCH_V2,
  [SignatureType.SIGN_UNISWAPX_V3_ORDER]: Routing.DUTCH_V3,
  [SignatureType.SIGN_PRIORITY_ORDER]: Routing.PRIORITY,
  [SignatureType.SIGN_UNISWAPX_ORDER]: Routing.DUTCH_V2,
  [SignatureType.SIGN_LIMIT]: Routing.DUTCH_V2,
}

const UNISWAPX_ORDER_ROUTINGS = [Routing.DUTCH_V2, Routing.DUTCH_V3, Routing.PRIORITY]

export default function ActivityTabShared({ account }: { account: Address }) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)

  const { formatNumberOrString } = useLocalizationContext()
  const allPendingOrders = usePendingOrders()
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const computeUniswapXActivities = useEvent(async () => {
    const signatures = allPendingOrders
      .filter((signature) => signature.type !== SignatureType.SIGN_LIMIT)
      .map((signature) => signatureToActivity(signature, formatNumberOrString))

    const signatureActivityArray = await Promise.all(signatures)

    const signatureActivityItemArray = signatureActivityArray
      .filter((signature): signature is Activity => signature !== undefined)
      .map((signature): ActivityItem => {
        return {
          typeInfo: {
            type: TransactionType.Swap,
            inputCurrencyId: currencyId(signature.currencies?.[0]) ?? '',
            outputCurrencyId: currencyId(signature.currencies?.[1]) ?? '',
            inputCurrencyAmountRaw:
              signature.offchainOrderDetails?.swapInfo.tradeType === TradeType.EXACT_INPUT
                ? signature.offchainOrderDetails.swapInfo.inputCurrencyAmountRaw
                : (signature.offchainOrderDetails?.swapInfo.expectedInputCurrencyAmountRaw ?? '0'),
            outputCurrencyAmountRaw:
              signature.offchainOrderDetails?.swapInfo.tradeType === TradeType.EXACT_INPUT
                ? signature.offchainOrderDetails.swapInfo.minimumOutputCurrencyAmountRaw
                : (signature.offchainOrderDetails?.swapInfo.outputCurrencyAmountRaw ?? '0'),
          },
          routing: signature.offchainOrderDetails?.type
            ? SIGNATURE_TYPE_TO_ROUTING_MAP[signature.offchainOrderDetails.type]
            : Routing.DUTCH_V2,
          id: signature.id,
          addedTime: signature.timestamp * ONE_SECOND_MS,
          status: signature.status,
          from: signature.from,
          orderHash: signature.hash,
          transactionOriginType: TransactionOriginType.Internal,
          chainId: signature.chainId,
        }
      })

    return signatureActivityItemArray
  })

  const { data: signatures }: { data: ActivityItem[] | undefined } = useQuery({
    queryKey: [
      ReactQueryCacheKey.SharedUniswapXActivities,
      account,
      allPendingOrders.map((order) => order.id),
      allPendingOrders.map((order) => order.status),
    ],
    queryFn: computeUniswapXActivities,
  })

  const { maybeEmptyComponent, renderActivityItem, sectionData } = useActivityData({
    owner: account,
    ownerAddresses: [account],
    swapCallbacks: {
      useLatestSwapTransaction: () => undefined,
      useSwapFormTransactionState: () => undefined,
      onRetryGenerator: () => () => {},
    },
    fiatOnRampParams: undefined,
    skip: false,
    extraTransactions: signatures,
  })

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <Flex mx="$spacing8" gap="$none">
      <OpenLimitOrdersButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
      <ScrollView showsVerticalScrollIndicator={false} width="100%">
        {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
        {(sectionData ?? []).map((item: ActivityItem, index) => {
          const isUniswapXOrder =
            !isSectionHeader(item) &&
            !isLoadingItem(item) &&
            item.typeInfo.type === TransactionType.Swap &&
            UNISWAPX_ORDER_ROUTINGS.includes(item.routing)
          const uniswapXOrder = isUniswapXOrder ? allPendingOrders.find((order) => order.id === item.id) : undefined

          return renderActivityItem({
            item,
            index,
            ...(uniswapXOrder ? { customDetailsModalOpen: () => openOffchainActivityModal(uniswapXOrder) } : {}),
          })
        })}
      </ScrollView>
    </Flex>
  )
}
