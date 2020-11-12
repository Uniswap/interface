import React from 'react'

import styled from 'styled-components'

const SkeletonWrap = styled.div`
  height: 2.1rem;
  width: 11.25rem;
  transform: translateX(58%);
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
interface SkeletonProps {}

export default function Skeleton({}: SkeletonProps) {
  return <SkeletonWrap></SkeletonWrap>
}
