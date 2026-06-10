import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'

interface DepositTokenSelectorProps {
  apyLabel: string
  options: EarnDepositSourceOption[]
  selectedSourceCurrencyId: string
  onSelectSourceCurrency: (currencyId: string) => void
}

export function DepositTokenSelector({
  apyLabel,
  options,
  selectedSourceCurrencyId,
  onSelectSourceCurrency,
}: DepositTokenSelectorProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)

  if (options.length === 0) {
    return null
  }

  const selected =
    options.find((option) => areCurrencyIdsEqual(option.currencyInfo.currencyId, selectedSourceCurrencyId)) ??
    options[0]
  const isMultiChain = options.length > 1

  const triggerRow = (
    <DepositTokenSelectorTriggerRow option={selected} apyLabel={apyLabel} isOpen={isOpen} isMultiChain={isMultiChain} />
  )

  if (!isMultiChain) {
    return (
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$surface1"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$spacing16"
      >
        {triggerRow}
      </Flex>
    )
  }

  return (
    <AdaptiveDropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      adaptToSheet
      allowFlip
      dropdownStyle={{ minWidth: 360, p: '$spacing8' }}
      trigger={
        <TouchableArea
          onPress={() => setIsOpen((prev) => !prev)}
          hoverable
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          p="$spacing16"
          width="100%"
        >
          {triggerRow}
        </TouchableArea>
      }
    >
      <Flex>
        {options.map((option) => (
          <DepositTokenSelectorMenuItem
            key={option.id}
            option={option}
            isSelected={areCurrencyIdsEqual(option.currencyInfo.currencyId, selected.currencyInfo.currencyId)}
            onSelect={() => {
              onSelectSourceCurrency(option.currencyInfo.currencyId)
              setIsOpen(false)
            }}
          />
        ))}
      </Flex>
    </AdaptiveDropdown>
  )
}

function DepositTokenSelectorTriggerRow({
  option,
  apyLabel,
  isOpen,
  isMultiChain,
}: {
  option: EarnDepositSourceOption
  apyLabel: string
  isOpen: boolean
  isMultiChain: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { currencyInfo } = option
  const { currency } = currencyInfo
  const balanceLabel = `${formatNumberOrString({
    value: option.balanceQuantity,
    type: NumberType.TokenNonTx,
  })} ${t('explore.earn.deposit.available')}`

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <Flex row alignItems="center" gap="$spacing12">
        <TokenLogo
          url={currencyInfo.logoUrl}
          size={iconSizes.icon32}
          chainId={currency.chainId}
          symbol={currency.symbol}
          name={currency.name}
        />
        <Flex>
          <Text variant="body2" color="$neutral1">
            {currency.symbol}
          </Text>
          <Text variant="body3" color="$neutral2">
            {balanceLabel}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="body3" color="$accent1">
          {apyLabel}
        </Text>
        {isMultiChain && <RotatableChevron color="$neutral2" direction={isOpen ? 'up' : 'down'} size="$icon.16" />}
      </Flex>
    </Flex>
  )
}

function DepositTokenSelectorMenuItem({
  option,
  isSelected,
  onSelect,
}: {
  option: EarnDepositSourceOption
  isSelected: boolean
  onSelect: () => void
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { currencyInfo, balanceQuantity, balanceUsd } = option
  const { currency } = currencyInfo
  // Token name on top, chain-scoped name below — matches Figma.
  const tokenName = currency.name ?? currency.symbol ?? ''
  const chainScopedName = `${getChainInfo(option.chainId).label} ${currency.symbol ?? ''}`.trim()

  return (
    <TouchableArea
      onPress={onSelect}
      hoverStyle={{ backgroundColor: '$surface2' }}
      borderRadius="$rounded12"
      px="$spacing8"
      py="$spacing8"
    >
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$spacing12" flexShrink={1}>
          <TokenLogo
            url={currencyInfo.logoUrl}
            size={iconSizes.icon36}
            chainId={currency.chainId}
            symbol={currency.symbol}
            name={currency.name}
          />
          <Flex flexShrink={1}>
            <Text variant="body2" color="$neutral1" numberOfLines={1}>
              {tokenName}
            </Text>
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {chainScopedName}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$spacing12">
          <Flex alignItems="flex-end">
            <Text variant="body2" color="$neutral1">
              {convertFiatAmountFormatted(balanceUsd, NumberType.FiatStandard)}
            </Text>
            <Text variant="body3" color="$neutral2">
              {formatNumberOrString({
                value: balanceQuantity,
                type: NumberType.TokenNonTx,
              })}
            </Text>
          </Flex>
          {isSelected ? <Check color="$accent1" size="$icon.20" /> : <Flex width={20} />}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
