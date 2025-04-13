import { NFTEventName, NFTFilterTypes } from '@uniswap/analytics-events'
import useDebounce from 'hooks/useDebounce'
import { TraitsHeader } from 'nft/components/collection/TraitsHeader'
import { Input } from 'nft/components/layout/Input'
import { subheadSmall } from 'nft/css/common.css'
import { Trait, useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { CSSProperties, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Checkbox, Flex, Text, useScrollbarStyles } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

const TRAIT_ROW_HEIGHT = 44
const MAX_FILTER_DROPDOWN_HEIGHT = 302

const TraitItem = ({
  trait,
  addTrait,
  removeTrait,
  isTraitSelected,
  style,
}: {
  trait: Trait
  addTrait: (trait: Trait) => void
  removeTrait: (trait: Trait) => void
  isTraitSelected: boolean
  style?: CSSProperties
}) => {
  const [isCheckboxSelected, setCheckboxSelected] = useState(false)
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)
  const toggleShowFullTraitName = useCollectionFilters((state) => state.toggleShowFullTraitName)

  const { shouldShow, trait_value, trait_type } = useCollectionFilters((state) => state.showFullTraitName)
  const isEllipsisActive = (e: MouseEvent<HTMLElement>) => {
    if (e.currentTarget.offsetWidth < e.currentTarget.scrollWidth) {
      toggleShowFullTraitName({
        shouldShow: true,
        trait_value: trait.trait_value,
        trait_type: trait.trait_type,
      })
    }
  }
  useEffect(() => {
    setCheckboxSelected(isTraitSelected)
  }, [isTraitSelected])

  const handleCheckbox = () => {
    scrollToTop()

    if (!isCheckboxSelected) {
      addTrait(trait)
      setCheckboxSelected(true)
    } else {
      removeTrait(trait)
      setCheckboxSelected(false)
    }
    sendAnalyticsEvent(NFTEventName.NFT_FILTER_SELECTED, { filter_type: NFTFilterTypes.TRAIT })
  }

  const showFullTraitName = shouldShow && trait_type === trait.trait_type && trait_value === trait.trait_value

  return (
    <Flex
      row
      alignItems="center"
      key={trait.trait_value}
      maxWidth="100%"
      overflow="hidden"
      className={`${subheadSmall}`}
      hoverStyle={{
        backgroundColor: '$surface3',
      }}
      justifyContent="space-between"
      cursor="pointer"
      pl="$padding12"
      pr="$padding16"
      borderRadius="$rounded12"
      style={{
        paddingBottom: '22px',
        paddingTop: '22px',
        ...style,
      }}
      maxHeight={44}
      onMouseEnter={handleHover}
      onMouseLeave={handleHover}
      onPress={handleCheckbox}
    >
      <Text
        variant="body2"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        style={{ minHeight: 15 }}
        maxWidth={!showFullTraitName ? 160 : '100%'}
        onMouseEnter={(e) => isEllipsisActive(e)}
        onMouseLeave={() => toggleShowFullTraitName({ shouldShow: false, trait_type: '', trait_value: '' })}
      >
        {trait.trait_type === 'Number of traits'
          ? `${trait.trait_value} trait${pluralize(Number(trait.trait_value))}`
          : trait.trait_value}
      </Text>
      <Checkbox checked={isCheckboxSelected} onCheckedChange={handleCheckbox} variant="branded" />
    </Flex>
  )
}

interface TraitRowProps {
  data: Array<Trait>
  index: number
  style: CSSProperties
}

export const TraitSelect = ({ traits, type, index }: { traits: Trait[]; type: string; index: number }) => {
  const addTrait = useCollectionFilters((state) => state.addTrait)
  const removeTrait = useCollectionFilters((state) => state.removeTrait)
  const selectedTraits = useCollectionFilters((state) => state.traits)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const scrollbarStyles = useScrollbarStyles()

  const searchedTraits = useMemo(
    () => traits.filter((t) => t.trait_value?.toString().toLowerCase().includes(debouncedSearch.toLowerCase())),
    [debouncedSearch, traits],
  )

  const Row = useCallback(
    function TraitRow({ data, index, style }: TraitRowProps) {
      const trait: Trait = data[index]

      const isTraitSelected = selectedTraits.find(
        ({ trait_type, trait_value }) =>
          trait_type === trait.trait_type && String(trait_value) === String(trait.trait_value),
      )
      return <TraitItem style={style} isTraitSelected={!!isTraitSelected} {...{ trait, addTrait, removeTrait }} />
    },
    [selectedTraits, addTrait, removeTrait],
  )

  const itemKey = useCallback((index: number, data: Trait[]) => {
    const trait = data[index]
    return `${trait.trait_type}_${trait.trait_value}_${index}`
  }, [])

  return traits.length ? (
    <TraitsHeader index={index} numTraits={traits.length} title={type}>
      <Input
        value={search}
        onChangeText={(value: string) => setSearch(value)}
        placeholder="Search"
        placeholderTextColor="$neutral2"
        mt="$spacing8"
        mb="$spacing8"
        autoComplete="off"
        position="static"
        width="full"
      />
      <Flex
        borderBottomColor="$surface3"
        borderBottomWidth={1}
        pl={0}
        pb="$padding8"
        maxHeight={MAX_FILTER_DROPDOWN_HEIGHT}
        style={{
          height: `${Math.min(TRAIT_ROW_HEIGHT * searchedTraits.length, MAX_FILTER_DROPDOWN_HEIGHT)}px`,
          ...scrollbarStyles,
        }}
      >
        <AutoSizer disableWidth>
          {({ height }: { height: number }) => (
            <FixedSizeList
              height={height}
              width="100%"
              itemData={searchedTraits}
              itemCount={searchedTraits.length}
              itemSize={TRAIT_ROW_HEIGHT}
              itemKey={itemKey}
            >
              {({ index, style, data }) => <Row style={style} key={itemKey(index, data)} data={data} index={index} />}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Flex>
    </TraitsHeader>
  ) : null
}
