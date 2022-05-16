import { Trans } from '@lingui/macro'
import ethereumLogoUrl from 'assets/images/ethereum-logo.png'
import kromatikaLogoUrl from 'assets/images/krom_logo.png'
import { MouseoverTooltip } from 'components/Tooltip'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { MEDIA_WIDTHS } from 'theme'

import { useAppDispatch } from '../../state/hooks'
import { switchToNetwork } from '../../utils/switchToNetwork'

const Logo = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`
const NetworkLabel = styled.div`
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const SelectorLabel = styled(NetworkLabel)`
  display: none;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    display: block;
    margin-right: 8px;
  }
`
const SelectorControls = styled.div<{ interactive: boolean }>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg1};
  border: 2px solid ${({ theme }) => theme.bg1};
  border-radius: 12px;
  color: ${({ theme }) => theme.text1};
  cursor: ${({ interactive }) => (interactive ? 'pointer' : 'auto')};
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 7.5px 8px;
`
const SelectorLogo = styled(Logo)<{ interactive?: boolean }>`
  margin-right: ${({ interactive }) => (interactive ? 8 : 0)}px;
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    margin-right: 8px;
  }
`
const Wrapper = styled.div`
  @media screen and (min-width: ${MEDIA_WIDTHS.upToSmall}px) {
    position: relative;
  }
`
const StyledSlash = styled.div`
  margin-right: 10px;
`

export default function CoinsBurned() {
  const [type, setType] = useState<boolean>(false)
  return (
    <MouseoverTooltip
      text={
        <Trans>
          Please deposit KROM up to the minimum balance. Recommendation is to deposit at least twice the minimum
          balance.
        </Trans>
      }
    >
      <Wrapper onClick={() => setType(!type)}>
        <SelectorControls interactive>
          <div style={{ marginRight: '10px' }}>
            <span>🔥</span>
          </div>
          {type ? (
            <>
              <SelectorLogo interactive src={kromatikaLogoUrl} />
              <SelectorLabel>42.0B</SelectorLabel>
            </>
          ) : (
            <>
              <SelectorLogo interactive src={ethereumLogoUrl} />
              <SelectorLabel>14.4M</SelectorLabel>
            </>
          )}
        </SelectorControls>
      </Wrapper>
    </MouseoverTooltip>
  )
}
