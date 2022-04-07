import { ChakraProvider, Flex, FormControl, FormLabel, SimpleGrid } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { Box, FormControlLabel, Switch } from '@material-ui/core'
import { Percent } from '@uniswap/sdk-core'
import { useContext, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { useIsExpertMode } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import Toggle from '../Toggle'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

const HoverText = styled(TYPE.main)`
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
    text-decoration: none;
  }
`

export default function SwapHeader() {
  const [expertMode, toggleExpertMode] = useExpertModeManager()

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <HoverText>
            <Box>
              PRO Mode
              <Switch checked={expertMode} color="primary" onClick={() => toggleExpertMode()} />
            </Box>
          </HoverText>
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
function handleSwitch(checked: any) {
  throw new Error('Function not implemented.')
}
