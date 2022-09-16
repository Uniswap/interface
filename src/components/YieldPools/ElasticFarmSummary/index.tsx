import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as Bulb } from 'assets/svg/sprinkling_bulb.svg'
import useTheme from 'hooks/useTheme'

import SummaryContent from './SummaryContent'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

const HighlightedText = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const ElasticFarmSummary = () => {
  const theme = useTheme()
  const [isOpen, setOpen] = useState(false)

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
        border: `1px solid ${theme.warning}`,
        borderRadius: '26px',
        padding: '16px 18px',
      }}
    >
      <Flex
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        role="button"
        onClick={() => setOpen(o => !o)}
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '8px',
            flex: '1 1',
          }}
        >
          <Flex
            sx={{
              flex: '0 0 20px',
            }}
          >
            <Bulb />
          </Flex>
          <Text
            sx={{
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.subText,
              flex: '1 1',
            }}
          >
            <Trans>
              Our current farms are based on an innovative farming mechanism we call{' '}
              <HighlightedText>Active Liquidity Time</HighlightedText>. Read the tips below to{' '}
              <HighlightedText>maximize</HighlightedText> your rewards!
            </Trans>
          </Text>
        </Flex>

        <Flex
          sx={{
            flex: '0 0 24px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DropdownIcon data-flip={isOpen} />
        </Flex>
      </Flex>

      <SummaryContent isOpen={isOpen} />
    </Flex>
  )
}

export default ElasticFarmSummary
