import { Flex, ScrollView, Text } from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { Check } from '@universe/mycelium/icons/Check'
import { Filter } from '@universe/mycelium/icons/Filter'
import { GridView } from '@universe/mycelium/icons/GridView'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FilterChip, type FilterChipColor } from 'uniswap/src/components/FilterChip/FilterChip'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { getMarginCurrencyInfo } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { marginTokenCurrencyId } from '~/features/margin/utils/marginCurrencies'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import type { MarginTokenFilterOption } from '~/pages/Swap/Margin/marginPairVenueList'

function iconRenderer(Icon: GeneratedIcon): (color: FilterChipColor) => JSX.Element {
  return (color) => <Icon size="$icon.16" color={color} />
}

const ALL_ICON = iconRenderer(GridView)

function CategoryChip({
  category,
  active,
  onSelect,
}: {
  category: TokenCategory
  active: boolean
  onSelect: (categoryId: string) => void
}): JSX.Element {
  const onPress = useEvent(() => onSelect(category.id))
  const renderIcon = useMemo(() => iconRenderer(getCategoryIcon(category)), [category])
  return <FilterChip active={active} label={category.name} renderIcon={renderIcon} onPress={onPress} />
}

// "All" plus the backend token categories the listed pairs' traded tokens belong to. Tapping the active
// category again also returns to All.
export function MarginCategoryChips({
  categories,
  categoryId,
  onSelectCategory,
}: {
  categories: TokenCategory[]
  categoryId: string | undefined
  onSelectCategory: (categoryId: string | undefined) => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const onSelect = useEvent((next: string) => onSelectCategory(categoryId === next ? undefined : next))
  const onSelectAll = useEvent(() => onSelectCategory(undefined))
  if (categories.length === 0) {
    return null
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Flex row alignItems="center" testID={TestID.MarginCategoryFilters}>
        <FilterChip
          active={categoryId === undefined}
          label={t('common.all')}
          renderIcon={ALL_ICON}
          onPress={onSelectAll}
        />
        {categories.map((category) => (
          <CategoryChip key={category.id} category={category} active={categoryId === category.id} onSelect={onSelect} />
        ))}
      </Flex>
    </ScrollView>
  )
}

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
        height: 36,
        borderRadius: '$roundedFull',
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
