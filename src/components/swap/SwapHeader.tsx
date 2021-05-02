import React from 'react'
import styled from 'styled-components'
import { Version } from '../../hooks/useToggledVersion'
// import Settings from '../Settings'
import { Link } from 'react-router-dom'

import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { ButtonGray } from 'components/Button'
import { X } from 'react-feather'

import { V3TradeState } from '../../hooks/useBestV3Trade'
import { isTradeBetter } from '../../utils/isTradeBetter'
import BetterTradeLink from '../../components/swap/BetterTradeLink'
import { useDerivedSwapInfo } from '../../state/swap/hooks'
import useTheme from '../../hooks/useTheme'

// import useToggledVersion, { Version } from '../../hooks/useToggledVersion'

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

  const theme = useTheme()

  const {
    v2Trade,
    v3TradeState: { trade: v3Trade, state: v3TradeState },
  } = useDerivedSwapInfo()

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Swap{' '}
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          {[V3TradeState.VALID, V3TradeState.SYNCING, V3TradeState.NO_ROUTE_FOUND].includes(v3TradeState) &&
            (toggledVersion === Version.v3 && isTradeBetter(v3Trade, v2Trade) ? (
              <BetterTradeLink version={Version.v2} otherTradeNonexistent={!v3Trade} />
            ) : toggledVersion === Version.v2 && isTradeBetter(v2Trade, v3Trade) ? (
              <BetterTradeLink version={Version.v3} otherTradeNonexistent={!v2Trade} />
            ) : null)}

          {toggledVersion === 'V2' ? (
            <ButtonGray
              width="fit-content"
              padding="0.1rem 0.25rem 0.1rem 0.5rem"
              as={Link}
              to="/swap"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '20px',
                opacity: 0.8,
              }}
            >
              {/* <Zap fill={theme.yellow1} size={11} style={{ marginRight: '0.25rem' }} /> */}
              <TYPE.main fontSize={11}>V2</TYPE.main>
              &nbsp; <X color={theme.text1} size={12} />
            </ButtonGray>
          ) : (
            <ButtonGray
              width="fit-content"
              padding="0.1rem 0.5rem"
              disabled
              style={{ display: 'flex', justifyContent: 'space-between', height: '20px', opacity: 0.4 }}
            >
              <TYPE.black fontSize={11}>V3</TYPE.black>
            </ButtonGray>
          )}

          {/* <Settings /> */}
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
