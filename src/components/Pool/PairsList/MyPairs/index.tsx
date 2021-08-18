import React from 'react'
import { Box, Flex } from 'rebass'
import { TYPE } from '../../../../theme'
import styled from 'styled-components'
import blurredCircle from '../../../../assets/svg/blurred-circle.svg'
import { UndecoratedLink } from '../../../UndercoratedLink'
import { DarkCard } from '../../../Card'

const SizedCard = styled(DarkCard)`
  width: 210px;
  height: 120px;
  padding: 12px 16px;
  background-image: none;
  cursor: pointer;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
  ${props => props.theme.mediaWidth.upToExtraSmall`
    height: initial;
  `}
`

const PlusNText = styled(TYPE.body)`
  z-index: 1;
`

const BlurredCircleImage = styled.div`
  width: 36px;
  height: 36px;
  background: rgba(68, 65, 99, 0.25);
  box-shadow: inset 0px 0.5px 3px rgba(255, 255, 255, 0.08), inset 3px 1px 5px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  z-index: 1px;
  backdrop-filter: blur(12px);
  border-radius: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: ${blurredCircle};
`

interface MyPairsProps {
  pairsAmount: number
}

export default function MyPairs({ pairsAmount }: MyPairsProps) {
  return (
    <UndecoratedLink to="/pools/mine">
      <SizedCard>
        <Flex justifyContent="space-between" flexDirection="column" width="100%" height="100%">
          <Box>
            <BlurredCircleImage>
              <PlusNText color="white" fontWeight="600" fontSize="16px" lineHeight="15px">
                {pairsAmount}
              </PlusNText>
            </BlurredCircleImage>
          </Box>
          <Box>
            <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
              MY PAIRS
            </TYPE.body>
          </Box>
        </Flex>
      </SizedCard>
    </UndecoratedLink>
  )
}
