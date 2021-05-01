import React from 'react'
import styled from 'styled-components'
import { Version } from '../../hooks/useToggledVersion'
import Settings from '../Settings'
import { Link } from 'react-router-dom'

import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { ButtonGray } from 'components/Button'
import { X } from 'react-feather'

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
  console.log(toggledVersion === 'V2')

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Swap{' '}
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          {toggledVersion === 'V2' ? (
            <ButtonGray
              width="fit-content"
              padding="0rem 0.5rem"
              as={Link}
              to="/swap"
              style={{ display: 'flex', justifyContent: 'space-between', height: '22px' }}
            >
              <TYPE.black fontSize={12}>V2</TYPE.black>&nbsp; <X size={14} />
            </ButtonGray>
          ) : (
            <ButtonGray
              width="fit-content"
              padding="0.1rem 0.5rem"
              disabled
              style={{ display: 'flex', justifyContent: 'space-between', height: '22px', opacity: 0.4 }}
            >
              <TYPE.black fontSize={12}>V3</TYPE.black>
            </ButtonGray>
          )}
          <Settings />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
