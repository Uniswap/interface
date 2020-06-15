import { ChainId, Pair, Token } from '@uniswap/sdk'
import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { useMediaLayout } from 'use-media'

import { X } from 'react-feather'
import { PopupContent } from '../../state/application/actions'
import { useActivePopups, useRemovePopup } from '../../state/application/hooks'
import { ExternalLink } from '../../theme'
import { AutoColumn } from '../Column'
import DoubleTokenLogo from '../DoubleLogo'
import Row from '../Row'
import TxnPopup from '../TxnPopup'
import { Text } from 'rebass'

const StyledClose = styled(X)`
  position: absolute;
  right: 10px;
  top: 10px;

  :hover {
    cursor: pointer;
  }
`

const MobilePopupWrapper = styled.div<{ height: string | number }>`
  position: relative;
  max-width: 100%;
  height: ${({ height }) => height};
  margin: ${({ height }) => (height ? '0 auto;' : 0)};
  margin-bottom: ${({ height }) => (height ? '20px' : 0)}};
`

const MobilePopupInner = styled.div`
  height: 99%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: row;
  -webkit-overflow-scrolling: touch;
  ::-webkit-scrollbar {
    display: none;
  }
`

const FixedPopupColumn = styled(AutoColumn)`
  position: absolute;
  top: 112px;
  right: 1rem;
  max-width: 355px !important;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const Popup = styled.div`
  display: inline-block;
  width: 100%;
  padding: 1em;
  background-color: ${({ theme }) => theme.bg1};
  position: relative;
  border-radius: 10px;
  padding: 20px;
  padding-right: 35px;
  z-index: 2;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 290px;
  `}
`

function PoolPopup({
  token0,
  token1
}: {
  token0: { address?: string; symbol?: string }
  token1: { address?: string; symbol?: string }
}) {
  const pairAddress: string | null = useMemo(() => {
    if (!token0 || !token1) return null
    // just mock it out
    return Pair.getAddress(
      new Token(ChainId.MAINNET, token0.address, 18),
      new Token(ChainId.MAINNET, token1.address, 18)
    )
  }, [token0, token1])

  return (
    <AutoColumn gap={'10px'}>
      <Text fontSize={20} fontWeight={500}>
        Pool Imported
      </Text>
      <Row>
        <DoubleTokenLogo a0={token0?.address ?? ''} a1={token1?.address ?? ''} margin={true} />
        <Text fontSize={16} fontWeight={500}>
          UNI {token0?.symbol} / {token1?.symbol}
        </Text>
      </Row>
      {pairAddress ? (
        <ExternalLink href={`https://uniswap.info/pair/${pairAddress}`}>View on Uniswap Info.</ExternalLink>
      ) : null}
    </AutoColumn>
  )
}

function PopupItem({ content, popKey }: { content: PopupContent; popKey: string }) {
  if ('txn' in content) {
    const {
      txn: { hash, success, summary }
    } = content
    return <TxnPopup popKey={popKey} hash={hash} success={success} summary={summary} />
  } else if ('poolAdded' in content) {
    const {
      poolAdded: { token0, token1 }
    } = content

    return <PoolPopup token0={token0} token1={token1} />
  }
}

export default function Popups() {
  const theme = useContext(ThemeContext)
  // get all popups
  const activePopups = useActivePopups()
  const removePopup = useRemovePopup()

  // switch view settings on mobile
  const isMobile = useMediaLayout({ maxWidth: '600px' })

  if (!isMobile) {
    return (
      <FixedPopupColumn gap="20px">
        {activePopups.map(item => {
          return (
            <Popup key={item.key}>
              <StyledClose color={theme.text2} onClick={() => removePopup(item.key)} />
              <PopupItem content={item.content} popKey={item.key} />
            </Popup>
          )
        })}
      </FixedPopupColumn>
    )
  }
  //mobile
  else
    return (
      <MobilePopupWrapper height={activePopups?.length > 0 ? 'fit-content' : 0}>
        <MobilePopupInner>
          {activePopups // reverse so new items up front
            .slice(0)
            .reverse()
            .map(item => {
              return (
                <Popup key={item.key}>
                  <StyledClose color={theme.text2} onClick={() => removePopup(item.key)} />
                  <PopupItem content={item.content} popKey={item.key} />
                </Popup>
              )
            })}
        </MobilePopupInner>
      </MobilePopupWrapper>
    )
}
