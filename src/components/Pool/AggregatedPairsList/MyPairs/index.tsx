import React from 'react'
import { Box, Flex } from 'rebass'
import { Pair } from 'dxswap-sdk'
import { TYPE } from '../../../../theme'
import StackedCards from '../../../StackedCards'
import styled from 'styled-components'
import blurredCircle from '../../../../assets/svg/blurred-circle.svg'
import { UndecoratedLink } from '../../../UndercoratedLink'

const StyledStackedCards = styled(StackedCards)`
  ::before {
    background: linear-gradient(144.61deg, rgba(42, 29, 147, 0.4) -1.14%, rgba(42, 29, 147, 0) 67.95%),
      linear-gradient(346.44deg, rgba(23, 22, 33, 0.96) 5.12%, rgba(23, 22, 33, 0) 60.38%), url(45jpg), #171621;
    background-blend-mode: lighten, normal, lighten, normal;
  }
`

const PlusNText = styled(TYPE.body)`
  z-index: 1;
`

const BlurredCircleImage = styled.div`
  width: 28px;
  height: 28px;
  background: rgba(68, 65, 99, 0.25);
  box-shadow: inset 0px 0.5px 3px rgba(255, 255, 255, 0.08), inset 3px 1px 5px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  width: 28px;
  height: 28px;
  z-index: 1px;
  backdrop-filter: blur(12px);
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: ${blurredCircle};
`

interface MyPairsProps {
  pairs: Pair[]
}

export default function MyPairs({ pairs }: MyPairsProps) {
  return (
    <UndecoratedLink to="/pools/mine">
      <StyledStackedCards>
        <Flex justifyContent="center" alignItems="center" flexDirection="column" width="100%" height="100%">
          <Box mb="4px">
            <BlurredCircleImage>
              <PlusNText color="white" fontWeight="600" fontSize="12px" lineHeight="15px">
                {pairs.length}
              </PlusNText>
            </BlurredCircleImage>
          </Box>
          <Box>
            <TYPE.body color="white" lineHeight="19.5px" fontWeight="600" fontSize="16px">
              MY PAIRS
            </TYPE.body>
          </Box>
        </Flex>
      </StyledStackedCards>
    </UndecoratedLink>
  )
}
