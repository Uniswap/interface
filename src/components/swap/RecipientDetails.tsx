// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import Popover from 'components/Popover'
import { RowBetween } from 'components/Row'
import { TooltipContainer } from 'components/Tooltip'
import { UKRAINE_GOV_ETH_ADDRESS } from 'constants/donations'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
  padding: 16px 12px;
`

const RecipientBadge = styled.div`
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  background: linear-gradient(90.9deg, rgba(21, 96, 152, 0.136) 2.37%, rgba(255, 213, 0, 0.056) 99.81%),
    rgba(255, 255, 255, 0.05);
`

export default function RecipientDetails() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <Wrapper>
      <RowBetween>
        <ThemedText.Gray>
          <Trans>Sending to</Trans>
        </ThemedText.Gray>
        <Popover
          show={showTooltip}
          content={
            <TooltipContainer>
              <ThemedText.Gray>{UKRAINE_GOV_ETH_ADDRESS}</ThemedText.Gray>
            </TooltipContainer>
          }
          placement="top"
        >
          <RecipientBadge onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <ThemedText.White>
              <Trans>Ukrainian Government</Trans>
            </ThemedText.White>
          </RecipientBadge>
        </Popover>
      </RowBetween>
    </Wrapper>
  )
}
