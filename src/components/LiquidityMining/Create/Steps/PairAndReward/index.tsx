import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex } from 'rebass'
import CurrencySearchModal from '../../../../SearchModal/CurrencySearchModal'
import PairSearchModal from '../../../../SearchModal/PairSearchModal'
import { Card, Divider } from '../../../styleds'
import AssetSelector from './AssetSelector'

interface PairAndRewardProps {
  liquidityPair: Pair | null
  reward: TokenAmount | null
  onLiquidityPairChange: (liquidityPair: Pair) => void
  onRewardTokenChange: (token: Token) => void
}

export default function PairAndReward({
  liquidityPair,
  reward,
  onLiquidityPairChange,
  onRewardTokenChange
}: PairAndRewardProps) {
  const [pairSearchOpen, setPairSearchOpen] = useState<boolean>(false)
  const [currencySearchOpen, setCurrencySearchOpen] = useState<boolean>(false)

  const handleOpenPairSearch = useCallback(() => {
    setPairSearchOpen(true)
  }, [])

  const handleDismissPairSearch = useCallback(() => {
    setPairSearchOpen(false)
  }, [])

  const handlePairSelection = useCallback(
    selectedPair => {
      onLiquidityPairChange(selectedPair)
    },
    [onLiquidityPairChange]
  )

  const handleOpenCurrencySearch = useCallback(() => {
    setCurrencySearchOpen(true)
  }, [])

  const handleDismissCurrencySearch = useCallback(() => {
    setCurrencySearchOpen(false)
  }, [])

  const handleCurrencySelection = useCallback(
    selectedCurrency => {
      onRewardTokenChange(selectedCurrency)
    },
    [onRewardTokenChange]
  )

  return (
    <>
      <Card>
        <Flex justifyContent="stretch" width="100%">
          <Box flex="1">
            <AssetSelector
              title="LIQUIDITY PAIR"
              currency0={liquidityPair?.token0}
              currency1={liquidityPair?.token1}
              onClick={handleOpenPairSearch}
            />
          </Box>
          <Box mx="18px">
            <Divider />
          </Box>
          <Box flex="1">
            <AssetSelector title="REWARD TOKEN" currency0={reward?.token} onClick={handleOpenCurrencySearch} />
          </Box>
        </Flex>
      </Card>
      <PairSearchModal
        isOpen={pairSearchOpen}
        onDismiss={handleDismissPairSearch}
        onPairSelect={handlePairSelection}
        selectedPair={liquidityPair}
      />
      <CurrencySearchModal
        isOpen={currencySearchOpen}
        onDismiss={handleDismissCurrencySearch}
        onCurrencySelect={handleCurrencySelection}
        selectedCurrency={reward?.token}
      />
    </>
  )
}
