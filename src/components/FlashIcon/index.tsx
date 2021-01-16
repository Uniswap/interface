import React from 'react'
import styled from 'styled-components'

const LeftIconWrapper = styled.div`
  position: absolute;
  top: 125px;
  left: calc(50% - 380px);
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const Icon = styled.svg`
  width: 150px;

  path {
    fill: ${({ theme }) => theme.bg10};
  }

  &:hover path {
    fill: url(#paint0_linear);
  }
`

const RightIconWrapper = styled.div`
  position: absolute;
  top: 125px;
  left: calc(50% + 230px);
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

export function LeftFlashIcon() {
  return (
    <LeftIconWrapper>
      <Icon width="181" height="385" viewBox="0 0 181 385" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M171.093 2.11142L26.5993 171.318C24.5304 173.878 25.1268 177.678 27.8878 179.47L78.9263 212.676C81.2971 214.218 82.1291 217.301 80.8553 219.832L59.1132 263.093L0.726682 376.733C-2.42457 382.561 5.43147 388.043 9.78285 383.041L92.6578 294.306L171.388 210.241C173.81 207.652 173.228 203.491 170.187 201.669L113.031 167.394C110.535 165.903 109.614 162.724 110.925 160.127L180.348 8.10921C183.345 2.17044 175.275 -3.0601 171.093 2.11142Z"
        />
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="50.8166"
            y1="-87.223"
            x2="-190.872"
            y2="50.8224"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#B1FFBF" />
            <stop offset="1" stopColor="#FFF16D" />
          </linearGradient>
        </defs>
      </Icon>
    </LeftIconWrapper>
  )
}

export function RightFlashIcon() {
  return (
    <RightIconWrapper>
      <Icon width="181" height="385" viewBox="0 0 181 385" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.90697 2.11142L154.401 171.318C156.47 173.878 155.873 177.678 153.112 179.47L102.074 212.676C99.7029 214.218 98.8709 217.301 100.145 219.832L121.887 263.093L180.273 376.733C183.425 382.561 175.569 388.043 171.217 383.041L88.3422 294.306L9.61246 210.241C7.19012 207.652 7.77176 203.491 10.8126 201.669L67.9695 167.394C70.4655 165.903 71.3858 162.724 70.0752 160.127L0.652008 8.10921C-2.34462 2.17044 5.72493 -3.0601 9.90697 2.11142Z"
        />
        <defs>
          <linearGradient
            id="paint0_linear"
            x1="50.8166"
            y1="-87.223"
            x2="-190.872"
            y2="50.8224"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#B1FFBF" />
            <stop offset="1" stopColor="#FFF16D" />
          </linearGradient>
        </defs>
      </Icon>
    </RightIconWrapper>
  )
}
