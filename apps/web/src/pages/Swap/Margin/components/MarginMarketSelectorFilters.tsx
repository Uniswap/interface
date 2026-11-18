import { Flex, Text } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { Filter } from '@universe/mycelium/icons/Filter'
import { GridView } from '@universe/mycelium/icons/GridView'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { getMarginCurrencyInfo } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { marginTokenCurrencyId } from '~/features/margin/utils/marginCurrencies'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import type { MarginTokenFilterOption } from '~/pages/Swap/Margin/marginPairVenueList'

const FILTER_LOGO_SIZE = 20

function FilterTokenLogo({
  option,
  currencyInfos,
}: {
  option: MarginTokenFilterOption
  currencyInfos: Map<string, CurrencyInfo>
}): JSX.Element {
  const info = getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(option.token) })
  return (
    <TokenLogo
      url={info?.logoUrl}
      symbol={marginUnwrapSymbol(option.token)}
      chainId={null}
      size={FILTER_LOGO_SIZE}
      hideNetworkLogo
    />
  )
}

function TokenFilterOption({
  value,
  label,
  icon,
  isSelected,
  testID,
  onSelect,
}: {
  value: string | undefined
  label: string
  icon: JSX.Element
  isSelected: boolean
  testID: string
  onSelect: (value: string | undefined) => void
}): JSX.Element {
  const onPress = useEvent(() => onSelect(value))
  return (
    <InternalMenuItem data-testid={testID} py="$spacing8" onPress={onPress}>
      <Flex row alignItems="center" gap="$gap12">
        {icon}
        <Text variant="body3" color="$neutral1">
          {label}
        </Text>
      </Flex>
      {isSelected ? <Check size="$icon.16" color="$accent1" strokeWidth={4} /> : null}
    </InternalMenuItem>
  )
}

// A single-token filter ("Long asset", "Debt asset") on the shared Dropdown: muted while it filters
// nothing, the chosen token's logo and symbol once it does.
export function MarginTokenFilter({
  label,
  anyLabel,
  options,
  selected,
  currencyInfos,
  testID,
  optionTestIdPrefix,
  alignRight,
  onSelect,
}: {
  label: string
  anyLabel: string
  options: MarginTokenFilterOption[]
  selected: string | undefined
  currencyInfos: Map<string, CurrencyInfo>
  testID: string
  optionTestIdPrefix: string
  alignRight?: boolean
  onSelect: (address: string | undefined) => void
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.address === selected)
  const onSelectOption = useEvent((address: string | undefined) => {
    onSelect(address)
    setIsOpen(false)
  })
  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      dataTestId={testID}
      alignRight={alignRight}
      menuLabel={
        <Flex row alignItems="center" gap="$gap8" flexShrink={1} minWidth={0}>
          {selectedOption ? (
            <FilterTokenLogo option={selectedOption} currencyInfos={currencyInfos} />
          ) : (
            <Filter size="$icon.20" color="$neutral2" />
          )}
          <Text variant="buttonLabel3" color={selectedOption ? '$neutral1' : '$neutral2'} numberOfLines={1}>
            {selectedOption ? marginUnwrapSymbol(selectedOption.token) : label}
          </Text>
        </Flex>
      }
      buttonStyle={{
        minWidth: 0,
        // The search field's height and radius, which it sits beside.
        height: 48,
        borderRadius: '$rounded16',
        borderWidth: '$spacing1',
        borderColor: '$surface3',
      }}
      dropdownStyle={{ minWidth: 200 }}
    >
      <>
        <TokenFilterOption
          value={undefined}
          label={anyLabel}
          icon={<GridView size="$icon.20" color="$neutral2" />}
          isSelected={!selectedOption}
          testID={optionTestIdPrefix}
          onSelect={onSelectOption}
        />
        {options.map((option) => (
          <TokenFilterOption
            key={option.address}
            value={option.address}
            label={marginUnwrapSymbol(option.token)}
            icon={<FilterTokenLogo option={option} currencyInfos={currencyInfos} />}
            isSelected={option.address === selectedOption?.address}
            testID={`${optionTestIdPrefix}${option.address}`}
            onSelect={onSelectOption}
          />
        ))}
      </>
    </Dropdown>
  )
}

type SideOption = 'all' | MarginDirection

// All / Long / Short; the large outlined control lands on the search field's 48px. No gap: the options'
// own padding spaces the labels, and the preset's 12px gap made the control too wide.
export function MarginSideFilter({
  selected,
  onSelect,
}: {
  selected: MarginDirection | undefined
  onSelect: (side: MarginDirection | undefined) => void
}): JSX.Element {
  const { t } = useTranslation()
  const onSelectOption = useEvent((side: SideOption) => onSelect(side === 'all' ? undefined : side))
  return (
    <Flex testID={TestID.MarginSideFilter}>
      <SegmentedControl<SideOption>
        size="large"
        gap="$none"
        options={[
          { value: 'all', displayText: t('common.all') },
          { value: MarginDirection.LONG, displayText: t('margin.side.long') },
          { value: MarginDirection.SHORT, displayText: t('margin.side.short') },
        ]}
        selectedOption={selected ?? 'all'}
        onSelectOption={onSelectOption}
      />
    </Flex>
  )
}
