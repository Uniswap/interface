import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName, FilterTypes } from '@uniswap/analytics-events'
import useDebounce from 'hooks/useDebounce'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { subheadSmall } from 'nft/css/common.css'
import { Trait, useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { CSSProperties, FormEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'

import { Input } from '../layout/Input'
import * as styles from './Filters.css'
import { TraitsHeader } from './TraitsHeader'

const TRAIT_ROW_HEIGHT = 44

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

  const handleCheckbox = (e: FormEvent) => {
    e.preventDefault()
    scrollToTop()

    if (!isCheckboxSelected) {
      addTrait(trait)
      setCheckboxSelected(true)
    } else {
      removeTrait(trait)
      setCheckboxSelected(false)
    }
    sendAnalyticsEvent(EventName.NFT_FILTER_SELECTED, { filter_type: FilterTypes.TRAIT })
  }

  const showFullTraitName = shouldShow && trait_type === trait.trait_type && trait_value === trait.trait_value

  return (
    <Row
      key={trait.trait_value}
      maxWidth="full"
      overflowX="hidden"
      overflowY="hidden"
      fontWeight="normal"
      className={`${subheadSmall} ${styles.subRowHover}`}
      justifyContent="space-between"
      cursor="pointer"
      paddingLeft="12"
      paddingRight="16"
      borderRadius="12"
      style={{
        paddingBottom: '22px',
        paddingTop: '22px',
        ...style,
      }}
      maxHeight="44"
      onMouseEnter={handleHover}
      onMouseLeave={handleHover}
      onClick={handleCheckbox}
    >
      <Box
        as="span"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        style={{ minHeight: 15 }}
        maxWidth={!showFullTraitName ? '160' : 'full'}
        onMouseOver={(e) => isEllipsisActive(e)}
        onMouseLeave={() => toggleShowFullTraitName({ shouldShow: false, trait_type: '', trait_value: '' })}
      >
        {trait.trait_type === 'Number of traits'
          ? `${trait.trait_value} trait${pluralize(Number(trait.trait_value))}`
          : trait.trait_value}
      </Box>
      <Checkbox checked={isCheckboxSelected} hovered={hovered} onChange={handleCheckbox}>
        <Box as="span" color="textTertiary" minWidth="8" paddingTop="2" paddingRight="12" position="relative">
          {!showFullTraitName && trait.trait_count}
        </Box>
      </Checkbox>
    </Row>
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

  const searchedTraits = useMemo(
    () => traits.filter((t) => t.trait_value?.toString().toLowerCase().includes(debouncedSearch.toLowerCase())),
    [debouncedSearch, traits]
  )

  const Row = useCallback(
    function TraitRow({ data, index, style }: TraitRowProps) {
      const trait: Trait = data[index]

      const isTraitSelected = selectedTraits.find(
        ({ trait_type, trait_value }) =>
          trait_type === trait.trait_type && String(trait_value) === String(trait.trait_value)
      )
      return <TraitItem style={style} isTraitSelected={!!isTraitSelected} {...{ trait, addTrait, removeTrait }} />
    },
    [selectedTraits, addTrait, removeTrait]
  )

  const itemKey = useCallback((index: number, data: Trait[]) => {
    const trait = data[index]
    return `${trait.trait_type}_${trait.trait_value}_${index}`
  }, [])

  return traits.length ? (
    <TraitsHeader index={index} numTraits={traits.length} title={type}>
      <Input
        value={search}
        onChange={(e: FormEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
        placeholder="Search"
        marginTop="8"
        marginBottom="8"
        autoComplete="off"
        position="static"
        width="full"
      />
      <Column
        className={styles.filterDropDowns}
        style={{ height: `${Math.min(TRAIT_ROW_HEIGHT * searchedTraits.length, styles.MAX_FILTER_DROPDOWN_HEIGHT)}px` }}
      >
        <AutoSizer disableWidth>
          {({ height }) => (
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
      </Column>
    </TraitsHeader>
  ) : null
}
