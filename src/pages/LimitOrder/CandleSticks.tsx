import { Skeleton, SkeletonText } from '@chakra-ui/react'
import { useActiveWeb3React } from 'hooks/web3'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { MousePointer } from 'react-feather'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'

const StyledIframe = styled.iframe`
  border: none;
  min-width: 100%;
  border-radius: 24px;
  height: 100%;
  min-height: 92vh;
  max-height: 100%;
  loading: lazy;
`

const StyledIframeComponent = styled.div`
  flex-grow: 1;
  width: 100%;
  height: 100%;
  max-height: 100%;
`

export function CandleSticks(props: { networkName: string; poolAddress: string; children?: React.ReactNode }) {
  const [darkMode] = useDarkModeManager()

  return (
    <StyledIframeComponent>
      <StyledIframe
        loading="lazy"
        src={`https://dexscreener.com/${props.networkName}/${props.poolAddress}?embed=1&theme=${
          darkMode ? 'dark' : 'light'
        }&info=0`}
      />
    </StyledIframeComponent>
  )
}

export const MemoizedCandleSticks = React.memo(CandleSticks)
