import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { Buy as BuyIcon } from 'ui/src/components/icons/Buy'
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
  handleBuyCryptoClick,
  handleReceiveCryptoClick,
  handleCEXTransferClick,
}: {
  handleBuyCryptoClick: () => void
  handleReceiveCryptoClick: () => void
  handleCEXTransferClick: () => void
}) => {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const providers = useCexTransferProviders()

  const BackgroundImageWrapperCallback = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <BackgroundImage image={isDarkMode ? CRYPTO_PURCHASE_BACKGROUND_DARK : CRYPTO_PURCHASE_BACKGROUND_LIGHT}>
          {children}
        </BackgroundImage>
      )
    },
    [isDarkMode],
  )

  const options: ActionCardItem[] = useMemo(
    () => [
      {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: ElementName.EmptyStateBuy,
        icon: <BuyIcon color="$accent1" size="$icon.28" />,
        onPress: handleBuyCryptoClick,
        BackgroundImageWrapperCallback,
      },
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
    [
      providers,
      BackgroundImageWrapperCallback,
      handleBuyCryptoClick,
      handleReceiveCryptoClick,
      handleCEXTransferClick,
      t,
    ],
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

const BackgroundImage = ({ children, image }: { children: React.ReactNode; image: string }): JSX.Element => {
  return (
    <Flex>
      <img
        src={image}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          zIndex: -1,
          borderRadius: 24,
          objectFit: 'cover',
          filter: 'blur(2px)',
        }}
      />
      {children}
    </Flex>
  )
}
