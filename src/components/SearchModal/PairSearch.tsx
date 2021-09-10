import { Pair } from '@swapr/sdk'
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { CloseIcon, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import { RowBetween } from '../Row'
import { filterPairs as filterPairsBySearchQuery } from './filtering'
import SortButton from './SortButton'
import { usePairsComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import { usePairAtAddress } from '../../data/Reserves'
import PairList from './PairList'
import { useAllPairs } from '../../hooks/useAllPairs'

interface PairSearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedPair?: Pair | null
  onPairSelect: (pair: Pair) => void
  showCommonBases?: boolean
  filterPairs?: (pair: Pair) => boolean
}

const Wrapper = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.bg1And2};
`

export function PairSearch({ selectedPair, onPairSelect, onDismiss, isOpen, filterPairs }: PairSearchProps) {
  const { t } = useTranslation()

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const { pairs: allPairs } = useAllPairs()

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)
  const searchPair = usePairAtAddress(searchQuery)

  const pairsComparator = usePairsComparator(invertSearchOrder)

  const filteredPairs: Pair[] = useMemo(() => {
    let pairs = allPairs
    if (filterPairs) pairs = allPairs.filter(filterPairs)
    if (isAddressSearch) return searchPair ? [searchPair] : []
    return filterPairsBySearchQuery(pairs, searchQuery)
  }, [allPairs, filterPairs, isAddressSearch, searchPair, searchQuery])

  const filteredSortedPairs: Pair[] = useMemo(() => {
    if (searchPair) return [searchPair]
    return filteredPairs.sort(pairsComparator)
  }, [filteredPairs, searchPair, pairsComparator])

  const handlePairSelect = useCallback(
    (pair: Pair) => {
      onPairSelect(pair)
      onDismiss()
    },
    [onDismiss, onPairSelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (filteredSortedPairs.length > 0) {
          if (
            (
              (filteredSortedPairs[0].token0.symbol || '') + (filteredSortedPairs[0].token1.symbol || '')
            ).toLowerCase() === searchQuery.trim().toLowerCase() ||
            filteredSortedPairs.length === 1
          ) {
            handlePairSelect(filteredSortedPairs[0])
          }
        }
      }
    },
    [filteredSortedPairs, handlePairSelect, searchQuery]
  )

  return (
    <Wrapper>
      <Column style={{ width: '100%', height: '100%', flex: '1 1' }}>
        <PaddedColumn gap="16px">
          <RowBetween>
            <TYPE.body fontWeight={500} fontSize={16}>
              Select a pair
            </TYPE.body>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <SearchInput
            type="text"
            placeholder={t('pairSearchPlaceholder')}
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
          <RowBetween>
            <TYPE.body fontSize="11px" lineHeight="13px" letterSpacing="0.06em">
              NAME
            </TYPE.body>
            <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
          </RowBetween>
        </PaddedColumn>
        <Separator />
        <PairList pairs={filteredSortedPairs} onPairSelect={handlePairSelect} selectedPair={selectedPair} />
      </Column>
    </Wrapper>
  )
}
