import { Pair } from 'dxswap-sdk'
import React, { useCallback } from 'react'
import { Box, Flex, Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { usePairAdder, usePairRemover } from '../../state/user/hooks'
import { useIsUserAddedPair } from '../../hooks/Tokens'
import Badge from '../Badge'
import { TokenListContainer, TokenPickerItem } from './styleds'
import { Plus, X } from 'react-feather'
import DoubleCurrencyLogo from '../DoubleLogo'
import { useExistingRawPairs } from '../../data/Reserves'
import { isPairOnList } from '../../utils'

function pairKey(pair: Pair): string {
  return `${pair.token0.symbol}${pair.token1.symbol}`
}

interface PairRowProps {
  pair: Pair
  onSelect: () => void
  isSelected: boolean
}

function PairRow({ pair, onSelect, isSelected }: PairRowProps) {
  const { chainId } = useActiveWeb3React()
  const pairsList = useExistingRawPairs()
  const isOnSelectedList = isPairOnList(pairsList, pair)
  const customAdded = useIsUserAddedPair(pair)

  const removePair = usePairRemover()
  const addPair = usePairAdder()

  const pairText = `${pair.token0.symbol || ''}/${pair.token1.symbol || ''}`

  // only show add or remove buttons if not on selected list
  return (
    <TokenPickerItem
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      alignItems="center"
      px="20px"
    >
      <Box mr="8px">
        <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={20} />
      </Box>
      <Box>
        <Text title={pairText} fontWeight={500}>
          {pairText}
        </Text>
      </Box>
      <Flex flex="1" px="20px">
        {!isOnSelectedList && (
          <Box>
            <Badge
              label={customAdded ? 'Added by user' : 'Found by address'}
              icon={customAdded ? X : Plus}
              onClick={event => {
                event.stopPropagation()
                if (!chainId) {
                  return
                }
                if (customAdded) {
                  removePair(pair)
                } else {
                  addPair(pair)
                }
              }}
            />
          </Box>
        )}
      </Flex>
    </TokenPickerItem>
  )
}

export default function PairList({
  pairs,
  selectedPair,
  onPairSelect
}: {
  pairs: Pair[]
  selectedPair?: Pair | null
  onPairSelect: (pair: Pair) => void
  otherPair?: Pair | null
}) {
  const Row = useCallback(
    (pair: Pair) => {
      const isSelected = Boolean(selectedPair && selectedPair.equals(pair))
      const handleSelect = () => onPairSelect(pair)
      return <PairRow pair={pair} isSelected={isSelected} onSelect={handleSelect} />
    },
    [onPairSelect, selectedPair]
  )

  return (
    <TokenListContainer flexDirection="column" width="100%" overflowY="auto">
      {pairs.map(pair => (
        <Box width="100%" height="56px" key={pairKey(pair)}>
          {Row(pair)}
        </Box>
      ))}
    </TokenListContainer>
  )
}
