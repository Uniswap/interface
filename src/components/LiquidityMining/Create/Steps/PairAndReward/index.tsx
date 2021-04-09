import { Pair, Token, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { useAllTokens } from '../../../../../hooks/Tokens'
import CurrencySearchModal from '../../../../SearchModal/CurrencySearchModal'
import PairSearchModal from '../../../../SearchModal/PairSearchModal'
import { Card, Divider } from '../../../styleds'
import AssetSelector from './AssetSelector'

const FlexContainer = styled(Flex)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

const RewardTokenContainer = styled(Box)`
  ${props => props.theme.mediaWidth.upToExtraSmall`
    margin-top: 16px !important;
  `}
`

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
  const allTokens = useAllTokens()

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

  const filterPairs = useCallback(
    (pair: Pair) => {
      const adjustedTokens = Object.values(allTokens)
      return (
        adjustedTokens.some(token => token.equals(pair.token0)) &&
        adjustedTokens.some(token => token.equals(pair.token1))
      )
    },
    [allTokens]
  )

  return (
    <>
      <Card>
        <FlexContainer justifyContent="stretch" width="100%">
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
          <RewardTokenContainer flex="1">
            <AssetSelector title="REWARD TOKEN" currency0={reward?.token} onClick={handleOpenCurrencySearch} />
          </RewardTokenContainer>
        </FlexContainer>
      </Card>
      <PairSearchModal
        isOpen={pairSearchOpen}
        onDismiss={handleDismissPairSearch}
        onPairSelect={handlePairSelection}
        selectedPair={liquidityPair}
        filterPairs={filterPairs}
      />
      <CurrencySearchModal
        isOpen={currencySearchOpen}
        onDismiss={handleDismissCurrencySearch}
        onCurrencySelect={handleCurrencySelection}
        selectedCurrency={reward?.token}
        showNativeCurrency={false}
      />
    </>
  )
}
