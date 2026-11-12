import { isExtensionApp } from '@universe/environment'
import { Flex, useIsDarkMode, useSporeColors } from '@universe/mycelium'
import { ArrowDownCircle } from '@universe/mycelium/icons/ArrowDownCircle'
import { Buy } from '@universe/mycelium/icons/Buy'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import type { AddFundsPressParams } from 'uniswap/src/features/providers/webForNudgeTypes'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getFiatOnRampURL } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { useCexTransferProviderPress } from '~/hooks/useCexTransferProviderPress'
import { useOpenReceiveCryptoModal } from '~/hooks/useOpenReceiveCryptoModal'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { ReceiveModalState } from '~/types/receiveCryptoModal'

const ICON_SIZE = 28
const ICON_SHIFT = 18

function CEXTransferLogo({ providers }: { providers: FORServiceProvider[] }): JSX.Element {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const displayProviders = providers.slice(0, 3)
  const totalLogos = displayProviders.length

  return (
    <Flex height={ICON_SIZE} width={totalLogos === 1 ? ICON_SIZE : ICON_SIZE + (totalLogos - 1) * ICON_SHIFT}>
      {displayProviders.map((provider, index) => (
        <Flex
          key={provider.serviceProvider}
          position="absolute"
          left={totalLogos === 1 ? 0 : index * ICON_SHIFT}
          borderRadius="$rounded8"
          zIndex={-index}
        >
          <img
            key={provider.serviceProvider}
            width={ICON_SIZE}
            height={ICON_SIZE}
            src={getOptionalServiceProviderLogo(provider.logos, isDarkMode)}
            alt={provider.name}
            style={{
              borderRadius: 8,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: colors.surface1.val,
            }}
          />
        </Flex>
      ))}
    </Flex>
  )
}

type AddFundsActions = {
  providers: FORServiceProvider[]
  onBuy: () => void
  onReceive: () => void
  openCexTransferProviderList: () => void
}

export function useAddFundsActions(buyParams?: AddFundsPressParams): AddFundsActions {
  const providers = useCexTransferProviders()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()

  const onBuy = useEvent(() => {
    accountDrawer.close()
    navigate(
      getFiatOnRampURL({ currencyId: buyParams?.currencyId, fiatAmount: buyParams?.fiatAmount }),
      isExtensionApp ? { replace: true } : undefined,
    )
  })

  const onReceive = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })
  const openCexTransferProviderList = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.CEX_TRANSFER,
  })

  return { providers, onBuy, onReceive, openCexTransferProviderList }
}

export function useAddFundsOptions({
  buyElementName,
  receiveElementName,
  cexTransferElementName,
}: {
  buyElementName: ElementName
  receiveElementName: ElementName
  cexTransferElementName: ElementName
}): { options: ActionCardItem[]; providers: FORServiceProvider[] } {
  const { t } = useTranslation()
  const { providers, onBuy, onReceive, openCexTransferProviderList } = useAddFundsActions()

  // Not in useAddFundsActions: AddFundsOptionCards already calls useCexTransferProviderPress per provider, and each
  // instance has its own session id, so a second call for the same provider refetches the widget.
  const singleCexProvider = providers.length === 1 ? providers[0] : undefined
  const { onPress: onPressSingleCexProvider } = useCexTransferProviderPress(singleCexProvider, {
    onWidgetError: openCexTransferProviderList,
  })
  const onCexTransfer = useEvent(() => {
    if (singleCexProvider) {
      onPressSingleCexProvider()
    } else {
      openCexTransferProviderList()
    }
  })

  const options: ActionCardItem[] = useMemo(
    () => [
      {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: buyElementName,
        icon: <Buy color="$accent1" size="$icon.28" />,
        onPress: onBuy,
        testId: TestID.EmptyStateBuy,
      },
      {
        title: t('home.empty.transfer'),
        blurb: t('home.empty.transfer.description'),
        elementName: receiveElementName,
        icon: <ArrowDownCircle color="$accent1" size="$icon.28" />,
        onPress: onReceive,
        testId: TestID.WalletReceiveCrypto,
      },
      ...(providers.length > 0
        ? [
            {
              title: t('home.empty.cexTransfer'),
              blurb: t('home.empty.cexTransfer.description'),
              elementName: cexTransferElementName,
              icon: <CEXTransferLogo providers={providers} />,
              onPress: onCexTransfer,
            },
          ]
        : []),
    ],
    [providers, onBuy, onReceive, onCexTransfer, t, buyElementName, receiveElementName, cexTransferElementName],
  )

  return { options, providers }
}
