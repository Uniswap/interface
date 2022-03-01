// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/smart-order-router'
import FlagImage from 'assets/images/ukraine_flag.png'
import { AutoColumn } from 'components/Column'
import { StyledFlagImage } from 'components/DonationHeader'
import Popover from 'components/Popover'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { TooltipContainer } from 'components/Tooltip'
import { UKRAINE_GOV_ETH_ADDRESS } from 'constants/donations'
import { useState } from 'react'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const darkGradient = `radial-gradient(87.53% 3032.45% at 5.16% 10.13%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%),
linear-gradient(0deg, rgba(0, 91, 187, 0.35), rgba(0, 91, 187, 0.35)), #000000;`
const lightGradient = ` url(image.png), radial-gradient(87.53% 3032.45% at 5.16% 10.13%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(0deg, #5D9FE4, #5D9FE4), rgba(255, 255, 255, 0.09);`

const lightSahdow = `0px 3px 10px rgba(0, 0, 0, 0.19), 0px 16px 24px rgba(0, 0, 0, 0.04);`
const darkShadow = ` 0px 4px 4px rgba(0, 0, 0, 0.25), 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 8px 11px rgba(255, 213, 0, 0.24);`

const Wrapper = styled.div<{ darkMode: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
  padding: 16px 12px;
  background: ${({ darkMode }) => (darkMode ? darkGradient : lightGradient)};
  box-shadow: ${({ darkMode }) => (darkMode ? darkShadow : lightSahdow)};

  overflow: hidden;
  :before {
    background-image: url(${FlagImage});
    background-repeat: no-repeat;
    overflow: hidden;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -1;
  }

  border: 2px solid #ffd500;
  box-sizing: border-box;
`

const RecipientBadge = styled.div`
  border-radius: 16px;
  width: fit-content;
  padding: 10px 16px;
  font-size: 14px;
  background: linear-gradient(90.9deg, rgba(21, 96, 152, 0.136) 2.37%, rgba(255, 213, 0, 0.056) 99.81%),
    rgba(255, 255, 255, 0.05);
`

export default function RecipientDetails({ amount }: { amount: string | undefined }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [darkMode] = useDarkModeManager()

  return (
    <Wrapper darkMode={darkMode}>
      <RowBetween>
        <AutoRow gap="md">
          <AutoColumn gap="4px">
            <ThemedText.White fontSize={'12px'} fontWeight={400}>
              To:
            </ThemedText.White>
            <ThemedText.White fontWeight={700}>{amount ? `${amount} ETH` : '0 ETH'}</ThemedText.White>
          </AutoColumn>
        </AutoRow>
        <Popover
          show={showTooltip}
          content={
            <TooltipContainer>
              <ThemedText.Body color="text3">{UKRAINE_GOV_ETH_ADDRESS}</ThemedText.Body>
            </TooltipContainer>
          }
          placement="top"
        >
          <ExternalLink href={getExplorerLink(ChainId.MAINNET, UKRAINE_GOV_ETH_ADDRESS, ExplorerDataType.ADDRESS)}>
            <RecipientBadge onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
              <Row>
                <StyledFlagImage />
                <ThemedText.White style={{ whiteSpace: 'nowrap' }}>
                  <Trans>Ukraine Government</Trans>
                </ThemedText.White>
              </Row>
            </RecipientBadge>
          </ExternalLink>
        </Popover>
      </RowBetween>
    </Wrapper>
  )
}
