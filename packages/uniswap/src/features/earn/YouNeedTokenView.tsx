import { isMobileApp } from '@universe/environment'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Bank } from 'ui/src/components/icons/Bank'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { openUri } from 'uniswap/src/utils/linking'

interface YouNeedTokenViewProps {
  currencyInfo: Maybe<CurrencyInfo>
  symbol: string
  tokenColor: string
  actionsDisabled?: boolean
  onBack: () => void
  onClose: () => void
  onSwapForToken: () => void
  onBuyWithCash: () => void
}

export function YouNeedTokenView({
  currencyInfo,
  symbol,
  tokenColor,
  actionsDisabled,
  onBack,
  onClose,
  onSwapForToken,
  onBuyWithCash,
}: YouNeedTokenViewProps): JSX.Element {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency
  const onOpenEarnHelp = useCallback(() => {
    openUri({ uri: UniswapHelpUrls.articles.earnHelp, isSafeUri: true, openExternalBrowser: true }).catch(
      () => undefined,
    )
  }, [])

  return (
    <Flex gap="$spacing24">
      {!isMobileApp && (
        <Flex row alignItems="center" justifyContent="space-between">
          <TouchableArea hoverable onPress={onBack}>
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
          <Flex row alignItems="center" gap="$spacing12">
            <TouchableArea
              row
              alignItems="center"
              gap="$spacing4"
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$rounded12"
              backgroundColor="$surface1"
              px="$spacing8"
              py="$spacing4"
              hoverStyle={{ backgroundColor: '$surface2' }}
              onPress={onOpenEarnHelp}
            >
              <MessageQuestion color="$neutral1" size="$icon.16" />
              <Text variant="buttonLabel4" color="$neutral1">
                {t('common.help')}
              </Text>
            </TouchableArea>
            <ModalCloseIcon onClose={onClose} />
          </Flex>
        </Flex>
      )}

      <Flex alignItems="center" gap="$spacing12" pt={isMobileApp ? '$spacing16' : '$spacing4'}>
        <TokenLogo
          hideNetworkLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon48}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Flex alignItems="center" gap="$spacing8">
          <Text variant="heading3" color="$neutral1">
            {t('explore.earn.needToken.title', { symbol })}
          </Text>
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('explore.earn.needToken.description', { symbol })}
          </Text>
          <Text variant="body3" color="$neutral1" fontWeight="$medium" cursor="pointer" onPress={onOpenEarnHelp}>
            {t('common.button.learn')}
          </Text>
        </Flex>
      </Flex>

      <Flex gap="$spacing8">
        <Button
          emphasis="primary"
          size="large"
          fill={false}
          width="100%"
          disabled={actionsDisabled}
          // tokenColor is a runtime hex string, not a Tamagui theme token — applied via `style`.
          style={{ backgroundColor: tokenColor }}
          onPress={onSwapForToken}
        >
          {t('explore.earn.needToken.swap', { symbol })}
        </Button>
        <Button
          emphasis="tertiary"
          size="large"
          borderWidth="$spacing1"
          borderColor="$surface3"
          fill={false}
          width="100%"
          backgroundColor="$surface3"
          icon={<Bank color="$neutral1" size="$icon.20" />}
          disabled={actionsDisabled}
          onPress={onBuyWithCash}
        >
          {t('explore.earn.needToken.buy')}
        </Button>
      </Flex>
    </Flex>
  )
}
