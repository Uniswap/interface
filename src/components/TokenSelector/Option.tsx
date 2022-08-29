import Fuse from 'fuse.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { TokenOption } from 'src/components/TokenSelector/types'
import { TokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import { formatNumberBalance, formatUSDPrice } from 'src/utils/format'
import { Flex } from '../layout'

interface OptionProps {
  option: TokenOption
  onPress: () => void
  matches: Fuse.FuseResult<TokenOption>['matches']
  tokenWarningLevel: TokenWarningLevel
}

export function Option({ option, onPress, matches, tokenWarningLevel }: OptionProps) {
  const symbolMatches = matches?.filter((m) => m.key === 'symbol')
  const nameMatches = matches?.filter((m) => m.key === 'name')
  const { currency, quantity, balanceUSD } = option
  const { t } = useTranslation()

  return (
    <Button testID={`currency-option-${currency.chainId}-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" gap="xs" justifyContent="space-between" py="sm">
        <Flex row shrink alignItems="center" gap="sm">
          <CurrencyLogo currency={currency} size={32} />
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
  )
}
