import React from 'react'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'

const StyledIframe = styled.iframe`
  border: none;
  border-radius: 20px;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 12px 6px ${({ theme }) => theme.shadow2};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    height: 90vh;
  `};
`

function CandleSticks(props: { networkName: string; poolAddress: string; children?: React.ReactNode }) {
  const [darkMode] = useDarkModeManager()

  return (
    <StyledIframe
      loading="lazy"
      src={`https://dexscreener.com/${props.networkName}/${props.poolAddress}?embed=1&theme=${
        darkMode ? 'dark' : 'light'
      }&info=0`}
    />
  )
}

const MemoizedCandleSticks = React.memo(CandleSticks)

export { MemoizedCandleSticks as default }
