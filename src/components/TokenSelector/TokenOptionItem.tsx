import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import { default as React, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { CurrencyInfoLogo } from 'src/components/CurrencyLogo/CurrencyInfoLogo'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
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
import { Flex } from '../layout'
interface OptionProps {
  option: TokenOption
  onPress: () => void
  tokenWarningLevelMap: TokenWarningLevelMap
  matches: Fuse.FuseResult<Currency>['matches']
}

export function TokenOptionItem({ option, onPress, tokenWarningLevelMap, matches }: OptionProps) {
  const symbolMatches = matches?.filter((m) => m.key === 'symbol')
  const nameMatches = matches?.filter((m) => m.key === 'name')
  const { currencyInfo, quantity, balanceUSD } = option
  const { currency } = currencyInfo

  const { t } = useTranslation()

  const [showWarningModal, setShowWarningModal] = useState(false)

  const id = currencyId(currency.wrapped)

  const tokenWarningLevel =
    tokenWarningLevelMap?.[currency.chainId]?.[id] ?? TokenWarningLevel.MEDIUM

  const [dismissedWarningTokens, dismissTokenWarning] = useDismissTokenWarnings()
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
            <CurrencyInfoLogo currencyInfo={currencyInfo} size={32} />
            <Flex shrink alignItems="flex-start" gap="none">
              <Flex centered row gap="xs">
                <Flex shrink>
                  <TextWithFuseMatches
                    matches={nameMatches}
                    text={currency.name ?? ''}
                    variant="subhead"
                  />
                </Flex>
                <WarningIcon tokenWarningLevel={tokenWarningLevel} />
              </Flex>
              <Flex row>
                <TextWithFuseMatches
                  matches={symbolMatches}
                  text={currency.symbol ?? ''}
                  variant="caption"
                />
              </Flex>
            </Flex>
          </Flex>

          {tokenWarningLevel === TokenWarningLevel.BLOCKED ? (
            <Flex backgroundColor="translucentBackground" borderRadius="md" padding="sm">
              <Text variant="mediumLabel">{t('Not available')}</Text>
            </Flex>
          ) : quantity && quantity !== 0 ? (
            <Box alignItems="flex-end">
              <Text variant="body">{formatNumberBalance(quantity)}</Text>
              <Text color="textSecondary" variant="bodySmall">
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
