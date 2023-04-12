import { Trans } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

type Props = {
  onClick: () => void
}

const Group = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  font-size: ${isMobile ? '14px' : '12px'};
`

const NumberOfSources = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 16px;
`

const LiquiditySourcesSetting: React.FC<Props> = ({ onClick }) => {
  const theme = useTheme()

  const allDexes = useAllDexes()
  const [excludeDexes] = useExcludeDexes()

  if (!allDexes?.length) {
    return null
  }

  const numberOfDEXes = allDexes?.length
  const selectedDexes = allDexes.filter(item => !excludeDexes.includes(item.id))

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      sx={{
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <Group>
        <TextDashed fontSize={12} fontWeight={400} color={theme.subText} underlineColor={theme.border}>
          <MouseoverTooltip
            text={<Trans>Your trade is routed through one or more of these liquidity sources</Trans>}
            placement="right"
          >
            <Trans>Liquidity Sources</Trans>
          </MouseoverTooltip>
        </TextDashed>
      </Group>

      <Group>
        <NumberOfSources>
          {selectedDexes.length || numberOfDEXes} out of {numberOfDEXes} selected
        </NumberOfSources>
        <ChevronRight size={20} color={theme.subText} />
      </Group>
    </Flex>
  )
}

export default LiquiditySourcesSetting
