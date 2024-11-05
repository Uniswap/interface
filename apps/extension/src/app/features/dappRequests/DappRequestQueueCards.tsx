import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { useShouldShowBridgingRequestCard } from 'src/app/features/dappRequests/hooks'
import { BRIDGING_BANNER } from 'ui/src/assets'
import { DappRequestCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { CardType, IntroCard, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { setHasViewedDappRequestBridgingBanner } from 'wallet/src/features/behaviorHistory/slice'

export function DappRequestCards(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { request, dappUrl, onCancel, totalRequestCount } = useDappRequestQueueContext()
  const { navigateToSwapFlow } = useWalletNavigation()

  const { numBridgingChains, shouldShowBridgingRequestCard } = useShouldShowBridgingRequestCard(request, dappUrl)
  const card = useMemo(
    (): IntroCardProps => ({
      graphic: {
        type: IntroCardGraphicType.Image,
        image: BRIDGING_BANNER,
      },
      title: t('dapp.request.bridge.title'),
      description: t('dapp.request.bridge.description', { numChains: numBridgingChains }),
      cardType: CardType.Dismissible,
      loggingName: DappRequestCardLoggingName.BridgingBanner,
      onClose: (): void => {
        dispatch(setHasViewedDappRequestBridgingBanner({ dappUrl, hasViewed: true }))
      },
      onPress: (): void => {
        if (request) {
          onCancel(request).catch(() => {})
        }
        dispatch(setHasViewedDappRequestBridgingBanner({ dappUrl, hasViewed: true }))
        navigateToSwapFlow({ openTokenSelector: CurrencyField.OUTPUT })
      },
      containerProps: {
        borderWidth: 0,
        backgroundColor: '$surface1',
      },
    }),
    [t, numBridgingChains, dispatch, dappUrl, onCancel, request, navigateToSwapFlow],
  )

  if (!request || !shouldShowBridgingRequestCard || totalRequestCount !== 1) {
    return null
  }

  return <IntroCard {...card} />
}
