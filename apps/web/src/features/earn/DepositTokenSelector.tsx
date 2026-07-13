import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { EARN_SELECTOR_DROPDOWN_MAX_HEIGHT } from '~/features/earn/constants'

interface DepositTokenSelectorProps {
  displayBalanceInFiat: boolean
  options: EarnDepositSourceOption[]
  selectedSourceCurrencyId: string
  onSelectSourceCurrency: (currencyId: string) => void
  unsupportedOptions: EarnDepositSourceOption[]
}

export function DepositTokenSelector({
  displayBalanceInFiat,
  options,
  selectedSourceCurrencyId,
  onSelectSourceCurrency,
  unsupportedOptions,
}: DepositTokenSelectorProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [showUnsupportedOptions, setShowUnsupportedOptions] = useState(false)

  if (options.length === 0) {
    return null
  }

  const selected =
    options.find((option) => areCurrencyIdsEqual(option.currencyInfo.currencyId, selectedSourceCurrencyId)) ??
    options.at(0)
  if (!selected) {
    return null
  }

  const isMultiChain = options.length > 1 || unsupportedOptions.length > 0

  const triggerRow = (
    <DepositTokenSelectorTriggerRow
      option={selected}
      displayBalanceInFiat={displayBalanceInFiat}
      isOpen={isOpen}
      isMultiChain={isMultiChain}
    />
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
      positionFixed
      matchTriggerWidth
      dropdownStyle={{
        maxHeight: EARN_SELECTOR_DROPDOWN_MAX_HEIGHT,
        p: '$spacing8',
      }}
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
        {unsupportedOptions.length > 0 && (
          <UnsupportedDepositSourceSection
            isOpen={showUnsupportedOptions}
            onToggle={() => setShowUnsupportedOptions((prev) => !prev)}
            options={unsupportedOptions}
          />
        )}
      </Flex>
    </AdaptiveDropdown>
  )
}

function UnsupportedDepositSourceSection({
  isOpen,
  onToggle,
  options,
}: {
  isOpen: boolean
  onToggle: () => void
  options: EarnDepositSourceOption[]
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex mt="$spacing4">
      <ExpandoRow
        isExpanded={isOpen}
        onPress={onToggle}
        label={t('explore.earn.deposit.unsupportedNetworks')}
        color="$neutral2"
      />
      {isOpen && (
        <Flex>
          {options.map((option) => (
            <DepositTokenSelectorMenuItem key={option.id} option={option} isSelected={false} disabled />
          ))}
        </Flex>
      )}
    </Flex>
  )
}

function DepositTokenSelectorTriggerRow({
  option,
  displayBalanceInFiat,
  isOpen,
  isMultiChain,
}: {
  option: EarnDepositSourceOption
  displayBalanceInFiat: boolean
  isOpen: boolean
  isMultiChain: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { currencyInfo } = option
  const { currency } = currencyInfo
  const tokenBalance = formatNumberOrString({
    value: option.balanceQuantity,
    type: NumberType.TokenNonTx,
  })
  const fiatBalance = convertFiatAmountFormatted(option.balanceUsd, NumberType.FiatStandard)
  const displayedBalance = displayBalanceInFiat && option.balanceUsd !== undefined ? fiatBalance : tokenBalance
  const balanceLabel = `${displayedBalance} ${t('explore.earn.deposit.available')}`

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
      {isMultiChain && <RotatableChevron color="$neutral2" direction={isOpen ? 'up' : 'down'} size="$icon.16" />}
    </Flex>
  )
}

function DepositTokenSelectorMenuItem({
  option,
  isSelected,
  onSelect,
  disabled = false,
}: {
  option: EarnDepositSourceOption
  isSelected: boolean
  onSelect?: () => void
  disabled?: boolean
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
      disabled={disabled}
      hoverStyle={disabled ? undefined : { backgroundColor: '$surface2' }}
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
            <Text variant="body2" color={disabled ? '$neutral2' : '$neutral1'} numberOfLines={1}>
              {tokenName}
            </Text>
            <Text variant="body3" color={disabled ? '$neutral3' : '$neutral2'} numberOfLines={1}>
              {chainScopedName}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$spacing12">
          <Flex alignItems="flex-end">
            <Text variant="body2" color={disabled ? '$neutral2' : '$neutral1'}>
              {convertFiatAmountFormatted(balanceUsd, NumberType.FiatStandard)}
            </Text>
            <Text variant="body3" color={disabled ? '$neutral3' : '$neutral2'}>
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
