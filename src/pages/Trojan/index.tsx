import React, { useState, useCallback, useEffect, useContext } from 'react'
import { Row as RowGrid, Col } from 'react-styled-flexboxgrid'
import styled, { keyframes } from 'styled-components'
import { Text } from 'rebass/styled-components'
import { animated, useTrail } from 'react-spring'
import { Currency, WETH } from '@uniswap/sdk'
import { RouteComponentProps } from 'react-router-dom'
import Notifier from 'react-desktop-notification'

import Logo from '../../assets/svg/logo.svg'
import LogoDark from '../../assets/svg/logo_white.svg'

import { SocketContext } from './socket'

import { ExternalLink, TYPE } from 'theme'
import { CardSection, DataCard, CardBGImage } from './styleds'
import { useDarkModeManager } from 'state/user/hooks'

import { AutoColumn } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { LoadingViewClear } from 'components/ModalViews'
import { ButtonDropdownGrey } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import TradeItem from 'components/Trojan/TradeItem'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

const gridTheme = {
  flexboxgrid: {
    // Defaults
    gridSize: 12, // columns
    gutterWidth: 0, // rem
    outerMargin: 0, // rem
    container: {
      xs: 100, // rem
      sm: 100, // rem
      md: 100, // rem
      lg: 100 // rem
    },
    breakpoints: {
      xs: 0, // em
      sm: 48, // em
      md: 64, // em
      lg: 75 // em
    }
  }
}

const handleColorType = (status?: any, theme?: any) => {
  switch (status) {
    case 'pending':
      return theme.text1
    case 'confirmed':
      return theme.text1
    case 'soon':
      return theme.text1
    case 'slippage':
      return theme.yellow1
  }
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
  margin-top: 0.5rem;
`

const ProposalStatus = styled.span<{ status: string }>`
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  color: ${({ status, theme }) => handleColorType(status, theme)};
  border: 1px solid ${({ status, theme }) => handleColorType(status, theme)};
  min-width: 10rem;
  justify-self: center;
  text-transform: capitalize;
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const UniIcon = styled.div`
  margin-top: 3rem;
  :hover {
    animation: 2s ${rotate} linear infinite;
  }
`
const Emoji = (props?: any) => {
  return (
    <span
      className="emoji"
      role="img"
      aria-label={props.label ? props.label : ''}
      aria-hidden={props.label ? 'false' : 'true'}
      style={{ fontSize: 16 }}
    >
      {props.symbol}
    </span>
  )
}
export default function Trojan({ history }: RouteComponentProps) {
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth
  })

  useEffect(() => {
    window.addEventListener('resize', handleResize)
  }, [])

  function handleResize() {
    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth
    })
  }

  const socket = useContext(SocketContext)

  const [darkMode] = useDarkModeManager()
  const [showSearch, setShowSearch] = useState<boolean>(false)

  const [currency0] = useState<Currency | null>(WETH[1])
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency1, setCurrency1] = useState<Currency | null>(null)
  const [pendingTxs, setPendingTxs] = useState(new Array<ITransaction>())
  const [confirmedTxs, setConfirmedTxs] = useState(new Array<ITransaction>())

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField !== Fields.TOKEN0) {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  useEffect(() => {
    if (currency1 !== null) {
      setPendingTxs(new Array<ITransaction>())
      setConfirmedTxs(new Array<ITransaction>())
      socket.emit('get_last_data_token', { currency0, currency1 })
    }
  }, [currency1])

  useEffect(() => {
    socket.on('pending_txs', (pendingTransactions: Array<ITransaction>) => {
      setPendingTxs(new Array<ITransaction>())
      console.log('LISTEN RECEIVED last pending', pendingTransactions)
      setPendingTxs(pendingTransactions)
    })
  }, [socket])

  useEffect(() => {
    socket.on('confirmed_txs', (confirmedTransactions: Array<ITransaction>) => {
      setConfirmedTxs(new Array<ITransaction>())
      console.log('LISTEN RECEIVED last confirmed', confirmedTransactions)
      setConfirmedTxs(confirmedTransactions)
    })
  }, [socket])

  useEffect(() => {
    socket.on('insert_pending_tx', (tx: ITransaction) => {
      console.log('LISTEN RECEIVED insert_pending_tx', tx)
      setPendingTxs(pendingTxs => [tx, ...pendingTxs])
      Notifier.start(
        'New Pending Tx | IN  ' + tx.prediction.fromToken.symbol + ' | OUT ' + tx.prediction.toToken.symbol,
        tx.prediction.linkEtherscan
      )
    })
  }, [socket])

  useEffect(() => {
    socket.on('insert_confirmed_tx', (tx: ITransaction) => {
      console.log('LISTEN RECEIVED insert_confirmed_tx', tx)
      setConfirmedTxs(confirmedTxs => [tx, ...confirmedTxs])
    })
  }, [socket])

  useEffect(() => {
    socket.on('delete_pending_tx', (tx: IDeletedTransaction) => {
      console.log('LISTEN RECEIVED delete_pending_tx', tx)
      setPendingTxs(pendingTxs => [...pendingTxs.filter(e => e._id !== tx._id)])
    })
  }, [socket])

  const trailPending = useTrail(pendingTxs.length, {
    from: { marginLeft: -10, opacity: 0 },
    to: { marginLeft: 10, opacity: 1 }
  })

  const trailConfirmed = useTrail(confirmedTxs.length, {
    from: { marginLeft: -10, opacity: 0 },
    to: { marginLeft: 10, opacity: 1 }
  })

  return (
    <>
      <RowGrid theme={gridTheme} style={{ paddingTop: '1.5rem' }}>
        {dimensions.width < 890 && (
          <Col xs={12} sm={12} md={0} lg={0}>
            <Row justify="center">
              <Row justify="center" style={{ width: '65%', marginBottom: '0.5rem' }}>
                <ButtonDropdownGrey
                  onClick={() => {
                    setShowSearch(true)
                    setActiveField(Fields.TOKEN1)
                  }}
                >
                  {currency1 ? (
                    <Row>
                      <CurrencyLogo currency={currency1} />
                      <Text fontWeight={500} fontSize={18} marginLeft={'12px'}>
                        {currency1.symbol}
                      </Text>
                    </Row>
                  ) : (
                    <Text fontWeight={500} fontSize={18} marginLeft={'12px'}>
                      Select Token to listen
                    </Text>
                  )}
                </ButtonDropdownGrey>
              </Row>
            </Row>
          </Col>
        )}
        <Col xs={12} sm={12} md={4} lg={4}>
          <Row justify="center">
            <ProposalStatus status={'pending'} style={{ textAlign: 'center', textTransform: 'none' }}>
              {pendingTxs.length} {'Mempool Pending TXs '}
              <Emoji symbol="🔮" />
            </ProposalStatus>
          </Row>
          {pendingTxs.length === 0 && <LoadingViewClear txt={'Scanning Pending TXs'} />}
          <Wrapper
            style={{ direction: 'rtl', marginTop: '1rem', height: dimensions.height - dimensions.height * 0.18 }}
          >
            {trailPending.map((props, index) => {
              const tx = pendingTxs[index]
              return (
                <animated.div key={pendingTxs[index].hash} style={props}>
                  <TradeItem tx={tx} currency1={currency1} initOpen={true}></TradeItem>
                </animated.div>
              )
            })}
          </Wrapper>
        </Col>
        <Col xs={0} sm={0} md={4} lg={4}>
          <Row justify="center">
            <Row justify="center" style={{ width: '65%', marginBottom: '0.5rem' }}>
              <ButtonDropdownGrey
                onClick={() => {
                  setShowSearch(true)
                  setActiveField(Fields.TOKEN1)
                }}
              >
                {currency1 ? (
                  <Row>
                    <CurrencyLogo currency={currency1} />
                    <Text fontWeight={500} fontSize={18} marginLeft={'12px'}>
                      {currency1.symbol}
                    </Text>
                  </Row>
                ) : (
                  <Text fontWeight={500} fontSize={18} marginLeft={'12px'}>
                    Select Token to listen
                  </Text>
                )}
              </ButtonDropdownGrey>
            </Row>
          </Row>
          <Text textAlign="center" style={{ padding: '1rem' }}>
            <DataCard>
              <CardBGImage />
              <CardSection>
                <AutoColumn gap="md">
                  <RowBetween style={{ justifyContent: 'center' }}>
                    <TYPE.white fontSize={22} fontWeight={800}>
                      Trojan.finance
                    </TYPE.white>
                  </RowBetween>
                  <RowBetween>
                    <TYPE.white fontSize={15}>
                      The Trojan platform gives the user the opportunity to take trading decisions based on future
                      transactions. It monitors the mempool and displays the most possible future result of each trade.
                    </TYPE.white>
                  </RowBetween>
                  <ExternalLink
                    style={{ color: 'white', textDecoration: 'underline' }}
                    href="https://trojan.finance/blog/trojan/"
                    target="_blank"
                  ></ExternalLink>

                  <UniIcon style={{ marginTop: 10 }}>
                    <img width={'35%'} src={darkMode ? LogoDark : Logo} alt="logo" />
                  </UniIcon>
                  <ProposalStatus status={'soon'}>{'The Future is your Friend'}</ProposalStatus>
                </AutoColumn>
              </CardSection>
              <CardBGImage />
            </DataCard>
          </Text>
          <Row justify="center" style={{ paddingBottom: '1rem' }}>
            <ProposalStatus status={'slippage'} style={{ textAlign: 'center', textTransform: 'none' }}>
              Trojan Finance is under development. We are stronger together. Jump in{' '}
              <ExternalLink href={'https://discord.gg/VZkFP78aeF'}>[Discord]</ExternalLink>
            </ProposalStatus>
          </Row>
        </Col>
        <Col xs={0} sm={0} md={4} lg={4}>
          <Row justify="center">
            <ProposalStatus status={'confirmed'} style={{ textAlign: 'center', textTransform: 'none' }}>
              {confirmedTxs.length}
              {' Confirmed TXs '}
              <Emoji symbol="☑️" />
            </ProposalStatus>
          </Row>
          {confirmedTxs.length === 0 && <LoadingViewClear txt={'Loading Confirmed TXs'} />}

          <Wrapper
            style={{ direction: 'ltr', marginTop: '1rem', height: dimensions.height - dimensions.height * 0.18 }}
          >
            {trailConfirmed.map((props, index) => {
              const tx = confirmedTxs[index]
              return (
                <animated.div key={confirmedTxs[index].hash} style={props}>
                  <TradeItem tx={tx} currency1={currency1} initOpen={false}></TradeItem>
                </animated.div>
              )
            })}
          </Wrapper>
        </Col>
      </RowGrid>
      <CurrencySearchModal
        isOpen={showSearch}
        onCurrencySelect={handleCurrencySelect}
        onDismiss={handleSearchDismiss}
        showCommonBases={false}
        selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
      />
    </>
  )
}
