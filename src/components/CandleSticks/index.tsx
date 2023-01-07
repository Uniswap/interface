import React from 'react'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'

const StyledIframe = styled.iframe`
  border: none;
  border-radius: 20px;
  width: 100%;
  height: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    height: 75vh;
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

export const MemoizedCandleSticks = React.memo(CandleSticks)
