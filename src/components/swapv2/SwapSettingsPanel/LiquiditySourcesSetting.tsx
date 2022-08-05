import { Trans, t } from '@lingui/macro'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronRight } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import QuestionHelper from 'components/QuestionHelper'
import { useActiveWeb3React } from 'hooks'
import useAggregatorStats from 'hooks/useAggregatorStats'
import useTheme from 'hooks/useTheme'

import { extractUniqueDEXes } from '../LiquiditySourcesPanel'

type Props = {
  onClick: () => void
}

const SettingLabel = styled.span`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 16px;
`

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
  const { chainId } = useActiveWeb3React()
  const { data, error } = useAggregatorStats(chainId)
  const theme = useTheme()

  if (error || !data) {
    return null
  }

  const dexIDs = Object.keys(data.pools)
  if (dexIDs.length === 0) {
    return null
  }

  const numberOfDEXes = extractUniqueDEXes(dexIDs).length

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
        <SettingLabel>
          <Trans>Liquidity Sources</Trans>
        </SettingLabel>
        <QuestionHelper text={t`Your trade is routed through one or more of these liquidity sources`} />
      </Group>

      <Group>
        <NumberOfSources>{numberOfDEXes}</NumberOfSources>
        <ChevronRight size={20} color={theme.subText} />
      </Group>
    </Flex>
  )
}

export default LiquiditySourcesSetting
