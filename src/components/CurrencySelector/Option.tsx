import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import TokenMetadata from 'src/components/CurrencySelector/TokenMetadata'
import { Text } from 'src/components/Text'
import { TextWithFuseMatches } from 'src/components/text/TextWithFuseMatches'
import { Flex } from '../layout'

interface OptionProps {
  currency: Currency
  onPress: () => void
  matches: Fuse.FuseResult<Currency>['matches']
  metadataType: 'balance' | 'price' | 'disabled'
  icon?: ReactElement | null
}

export function Option({ currency, onPress, matches, metadataType, icon }: OptionProps) {
  const symbolMatches = matches?.filter((m) => m.key === 'symbol')
  const nameMatches = matches?.filter((m) => m.key === 'name')
  const { t } = useTranslation()

  return (
    <Pressable testID={`currency-option-${currency.chainId}-${currency.symbol}`} onPress={onPress}>
      <Flex row alignItems="center" justifyContent="space-between" py="sm">
        <Flex row flexShrink={1} gap="sm" overflow="hidden">
          <CurrencyLogo currency={currency} size={40} />
          <Flex alignItems="flex-start" flexShrink={1} gap="none">
            <Flex centered row gap="xs">
              <TextWithFuseMatches
                matches={nameMatches}
                text={currency.name ?? ''}
                variant="subhead"
              />
              {icon}
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
        {metadataType !== 'disabled' ? (
          <TokenMetadata currency={currency} metadataType={metadataType} />
        ) : (
          <Flex backgroundColor="translucentBackground" borderRadius="md" padding="sm">
            <Text variant="mediumLabel">{t('Not available')}</Text>
          </Flex>
        )}
      </Flex>
    </Pressable>
  )
}
