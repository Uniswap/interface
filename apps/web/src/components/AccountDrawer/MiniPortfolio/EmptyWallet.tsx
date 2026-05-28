import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { ActionCard, ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { getServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

const ICON_SIZE = 28
const ICON_SHIFT = 18

function CEXTransferLogo({ providers }: { providers: FORServiceProvider[] }) {
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
            src={getServiceProviderLogo(provider.logos, isDarkMode)}
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

export const EmptyWallet = ({
  handleReceiveCryptoClick,
  handleCEXTransferClick,
}: {
  handleReceiveCryptoClick: () => void
  handleCEXTransferClick: () => void
}) => {
  const { t } = useTranslation()
  const providers = useCexTransferProviders()

  const options: ActionCardItem[] = useMemo(
    () => [
      // Temporarily hide "Buy crypto" until the on-ramp flow is fixed.
      // {
      //   title: t('home.tokens.empty.action.buy.title'),
      //   blurb: t('home.tokens.empty.action.buy.description'),
      //   elementName: ElementName.EmptyStateBuy,
      //   icon: <BuyIcon color="$accent1" size="$icon.28" />,
      //   onPress: handleBuyCryptoClick,
      //   BackgroundImageWrapperCallback,
      // },
      {
        title: t('home.empty.transfer'),
        blurb: t('home.empty.transfer.description'),
        elementName: ElementName.EmptyStateReceive,
        icon: <ArrowDownCircle color="$accent1" size="$icon.28" />,
        onPress: handleReceiveCryptoClick,
      },
      ...(providers.length > 0
        ? [
            {
              title: t('home.empty.cexTransfer'),
              blurb: t('home.empty.cexTransfer.description'),
              elementName: ElementName.EmptyStateCEXTransfer,
              icon: <CEXTransferLogo providers={providers} />,
              onPress: handleCEXTransferClick,
            },
          ]
        : []),
    ],
    [providers, handleReceiveCryptoClick, handleCEXTransferClick, t],
  )

  return (
    <Flex gap="$spacing20">
      <Separator />
      <Flex>
        <Text variant="subheading2" color="$neutral1">
          <Trans i18nKey="onboarding.welcome.title" />
        </Text>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="home.tokens.empty.welcome.description" />
        </Text>
      </Flex>
      <Flex gap="$spacing12">
        {options.map((option) => (
          <ActionCard
            key={option.title}
            {...option}
            leftAlign
            hoverStyle={{
              backgroundColor: '$surface1Hovered',
              borderColor: '$surface3Hovered',
            }}
          />
        ))}
      </Flex>
    </Flex>
  )
}

// Background image wrapper is currently unused since Buy crypto is disabled.
