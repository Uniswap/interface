import React from 'react'
import styled from 'styled-components'
import { Version } from '../../hooks/useToggledVersion'
import Settings from '../Settings'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'

// import { Info } from 'react-feather'

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`
//
// const InfoLink = styled(ExternalLink)`
//   width: 100%;
//   text-align: center;
//   font-size: 14px;
//   height: 20px;
//   margin-right: 8px;
//   color: ${({ theme }) => theme.text1};
// `

interface SwapHeaderProps {
  toggledVersion: Version
}

export default function SwapHeader({ toggledVersion }: SwapHeaderProps) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <TYPE.black fontWeight={500} fontSize={16} style={{ opacity: '0.6' }}>
          Swap ({toggledVersion})
        </TYPE.black>
        <RowFixed>
          {/* Send icon appears here when expert mode is toggled on */}
          {/* <Send style={{ marginRight: '16px' }} size="20" onClick={() => onChangeRecipient('')} /> */}
          {/* This info icon should open uniswap.info with the pair */}
          {/*{trade && (*/}
          {/*  <InfoLink*/}
          {/*    href={'https://info.uniswap.org/pair/' + trade.route.pairs[0].liquidityToken.address}*/}
          {/*    target="_blank"*/}
          {/*  >*/}
          {/*    <Info size="20" style={{ opacity: '0.6' }} />*/}
          {/*  </InfoLink>*/}
          {/*)}*/}

          <Settings />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
