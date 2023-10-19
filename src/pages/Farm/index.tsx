import { Trans } from '@lingui/macro'
import { Farms } from 'components/Farm/Farm'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FarmLayout = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

export function Farm() {
  return (
    <FarmLayout id="farmPage">
      <TitleContainer>
        <MouseoverTooltip text={<Trans>This table contains the farm.</Trans>} placement="bottom">
          <ThemedText.LargeHeader>
            <Trans>Farm</Trans>
          </ThemedText.LargeHeader>
        </MouseoverTooltip>
      </TitleContainer>

      <Farms />
    </FarmLayout>
  )
}
