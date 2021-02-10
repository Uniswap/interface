import React from 'react'
import { Box, Flex } from 'rebass'
import CurrencyLogo from '../../../CurrencyLogo'
import { Token } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import BigNumber from 'bignumber.js'
import StackedCards from '../../../StackedCards'
import styled from 'styled-components'
import blurredCircle from '../../../../assets/svg/blurred-circle.svg'
import { UndecoratedLink } from '../../../UndercoratedLink'

const CurrencyLogosContainer = styled(Box)`
  position: relative;
  width: 43.85px;
  height: 28px;
`

const PlusNContainer = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
`

const PlusNText = styled(TYPE.body)`
  z-index: 1;
`

const BlurredCircleImage = styled.img`
  width: 28px;
  height: 28px;
  position: absolute;
  right: 0px;
  top: 0;
  z-index: 1px;
  backdrop-filter: blur(16px);
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
`

interface PairCardProps {
  token: Token
  usdRewards: BigNumber
  pairsNumber: number
}

export default function AggregatedPairs({ token, usdRewards, pairsNumber }: PairCardProps) {
  return (
    <UndecoratedLink to={`/pools/${token.address}`}>
      <StackedCards>
        <Flex justifyContent="center" alignItems="center" flexDirection="column" width="100%" height="100%">
          <CurrencyLogosContainer mb="6px">
            <CurrencyLogo currency={token} size="28px" />
            <PlusNContainer>
              <BlurredCircleImage src={blurredCircle} width={28} height={28} />
              <PlusNText color="white" fontWeight="600" fontSize="12px" lineHeight="15px">
                +{pairsNumber}
              </PlusNText>
            </PlusNContainer>
          </CurrencyLogosContainer>
          <Box>
            <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
              {token.symbol}
            </TYPE.body>
          </Box>
          {usdRewards.isGreaterThan(0) && (
            <Box mt="8px">
              <TYPE.subHeader fontSize="9px" color="text3" lineHeight="14px" letterSpacing="2%" fontWeight="600">
                ${usdRewards.decimalPlaces(2).toString()} REWARDS
              </TYPE.subHeader>
            </Box>
          )}
        </Flex>
      </StackedCards>
    </UndecoratedLink>
  )
}
