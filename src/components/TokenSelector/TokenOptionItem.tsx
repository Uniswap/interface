import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Box, Flex } from 'src/components/layout'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'

import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { TokenOption } from 'src/components/TokenSelector/types'
import {
  TokenWarningLevel,
  TokenWarningLevelMap,
  useDismissTokenWarnings,
} from 'src/features/tokens/useTokenWarningLevel'
import { currencyId } from 'src/utils/currencyId'
import { formatNumberBalance, formatUSDPrice } from 'src/utils/format'

interface OptionProps {
  option: TokenOption
  showNetworkPill: boolean
  onPress: () => void
  tokenWarningLevelMap: TokenWarningLevelMap
}

export function TokenOptionItem({
  option,
  showNetworkPill,
  onPress,
  tokenWarningLevelMap,
}: OptionProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [dismissedWarningTokens, dismissTokenWarning] = useDismissTokenWarnings()

  const { currencyInfo, quantity, balanceUSD } = option
  const { currency } = currencyInfo
  const id = currencyId(currency.wrapped)

  const tokenWarningLevel =
    tokenWarningLevelMap?.[currency.chainId]?.[id] ?? TokenWarningLevel.MEDIUM
  const dismissed = Boolean(dismissedWarningTokens[currency.chainId]?.[currency.wrapped.address])

  const onPressTokenOption = useCallback(() => {
    if (
      tokenWarningLevel === TokenWarningLevel.BLOCKED ||
      ((tokenWarningLevel === TokenWarningLevel.LOW ||
        tokenWarningLevel === TokenWarningLevel.MEDIUM) &&
        !dismissed)
    ) {
      Keyboard.dismiss()
      setShowWarningModal(true)
      return
    }

    onPress()
  }, [dismissed, onPress, tokenWarningLevel])

  return (
    <>
      <Button
        opacity={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 0.5 : 1}
        testID={`token-option-${currency.chainId}-${currency.symbol}`}
        onPress={onPressTokenOption}>
        <Flex row alignItems="center" gap="xs" justifyContent="space-between" py="sm">
          <Flex row shrink alignItems="center" gap="sm">
            <TokenLogo
              chainId={currency.chainId}
              size={theme.imageSizes.lg}
              symbol={currency.symbol}
              url={currencyInfo.logoUrl ?? undefined}
            />
            <Flex shrink alignItems="flex-start" gap="none">
              <Flex centered row gap="xs">
                <Flex shrink>
                  <Text color="textPrimary" numberOfLines={1} variant="bodyLarge">
                    {currency.name}
                  </Text>
                </Flex>
                <WarningIcon
                  height={theme.iconSizes.sm}
                  tokenWarningLevel={tokenWarningLevel}
                  width={theme.iconSizes.sm}
                />
              </Flex>
              <Flex centered row gap="xs">
                <Text color="textSecondary" numberOfLines={1} variant="subheadSmall">
                  {currency.symbol}
                </Text>
                {showNetworkPill && <InlineNetworkPill chainId={currency.chainId} height={20} />}
              </Flex>
            </Flex>
          </Flex>

          {tokenWarningLevel === TokenWarningLevel.BLOCKED ? (
            <Text variant="bodySmall">{t('Not available')}</Text>
          ) : quantity && quantity !== 0 ? (
            <Box alignItems="flex-end">
              <Text variant="bodyLarge">{formatNumberBalance(quantity)}</Text>
              <Text color="textSecondary" variant="subheadSmall">
                {formatUSDPrice(balanceUSD)}
              </Text>
            </Box>
          ) : null}
        </Flex>
      </Button>

      {showWarningModal ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={() => {
            dismissTokenWarning(currency)
            setShowWarningModal(false)
            onPress()
          }}
          onClose={() => setShowWarningModal(false)}
        />
      ) : null}
    </>
  )
}
