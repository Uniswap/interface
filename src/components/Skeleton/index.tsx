import React from 'react'

import styled from 'styled-components'

const SkeletonWrap = styled.div`
  height: 1rem;
  width: 4rem;
  animation-duration: 2s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: placeHolderShimmer;
  animation-timing-function: linear;
  background-size: 800px 104px;
  background: ${({ theme }) => theme.SkeletonBG};
  @keyframes placeHolderShimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }
`

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SkeletonProps {
  loading: boolean
  children: React.ReactNode
}

export default function Skeleton({ loading, children }: SkeletonProps) {
  return <>{loading ? children : <SkeletonWrap></SkeletonWrap>}</>
}
