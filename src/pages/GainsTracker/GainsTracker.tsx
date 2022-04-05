import { Trans } from '@lingui/react'
import { Currency, WETH9 } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { CardSection } from 'components/earn/styled'
import Tooltip from 'components/Tooltip'
import moment from 'moment'
import { Wrapper } from 'pages/RemoveLiquidity/styled'
import { useTrumpBalance } from 'pages/Vote/VotePage'
import React, { useCallback } from 'react'
import { AlertCircle, Calendar, ChevronDown, Info } from 'react-feather'
import { useCurrencyBalance, useTokenBalance } from 'state/wallet/hooks'
import styled from 'styled-components/macro'
import _ from 'lodash'
import { USDC } from 'constants/tokens'
import { routerAbi, routerAddress } from 'pages/Vote/routerAbi'
import Web3 from 'web3'
import { BlueCard } from 'components/Card'
import { TYPE } from 'theme'
import { GreyCard } from 'components/Card'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { walletconnect } from 'connectors'
import { DarkCard } from 'components/Card'
const DisabledMask = styled.div`
  position: relative;
  pointer-events: none;
  display: inline-block;
  &:hover {
  }

  &::before {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    visibility: visible;
    opacity: 0.25;
    background-color: black;
    cursor: not-allowed;
    //background: url('http://i.imgur.com/lCTVr.png'); /* Uncomment this  to use the image */
    content: '';
  }
`

type StoredAndTrackedGains = {
  storedBalance: string
  selectedCurrency: Currency
  trackingSince: string
}

const CUSTOM_GAINS_KEY = 'custom_gains'

export const GainsTracker = () => {
  const { account } = useWeb3React()
  const trumpBalance = useTrumpBalance(account)
  const [currency, setCurrency] = React.useState<any>(undefined)
  const onUserInput = (value: any) => {
    setCurrency(value)
  }
  const handleInputSelect = useCallback((currency: Currency) => {
    onUserInput(currency)
  }, [])

  const handleTypeInput = (val: any) => {
    return
  }

  const isTrackingCustom = React.useMemo(() => {
    const trackingCustom = localStorage.getItem(CUSTOM_GAINS_KEY)
    if (trackingCustom) {
      const custominstance = JSON.parse(trackingCustom) as StoredAndTrackedGains
      return !!custominstance
    } else {
      return false
    }
  }, [localStorage.getItem(CUSTOM_GAINS_KEY)])

  const [isTrackingGains, setIsTracking] = React.useState(isTrackingCustom)

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)

  const [showTip, setShowTip] = React.useState(false)
  const tipmessage = `NOTE: The GainsTracker has no way to validate that the token you are selecting is a valid redistribution token. If you select a token that does not give redistribution, and start tracking, no gains will ever be tracked.`

  const startTrackingCustom = useCallback(() => {
    if (selectedCurrencyBalance) {
      const payload: StoredAndTrackedGains = {
        selectedCurrency: currency,
        storedBalance: selectedCurrencyBalance?.toFixed(2),
        trackingSince: `${new Date()}`,
      }
      localStorage.setItem(CUSTOM_GAINS_KEY, JSON.stringify(payload))
      setIsTracking(true)
    }
  }, [selectedCurrencyBalance, currency])

  React.useEffect(() => {
    if (!trumpBalance || (trumpBalance && +trumpBalance?.toFixed(2) <= 0)) stopTrackingCustom()

    const trackingCustom = JSON.parse(localStorage.getItem(CUSTOM_GAINS_KEY)!) as StoredAndTrackedGains
    if (trackingCustom) {
      setIsTracking(true)

      const currency = {
        ...trackingCustom.selectedCurrency,
        equals: (val: any) => _.isEqual(trackingCustom.selectedCurrency, val),
      }
      setCurrency(currency)
    } else {
      setIsTracking(false)
    }
  }, [])

  const stopTrackingCustom = useCallback(() => {
    localStorage.removeItem(CUSTOM_GAINS_KEY)
    setCurrency(undefined)
    setIsTracking(false)
  }, [currency, isTrackingGains])

  const gains = useCallback(() => {
    if (isTrackingGains && selectedCurrencyBalance) {
      const trackingCustom = JSON.parse(localStorage.getItem(CUSTOM_GAINS_KEY)!) as StoredAndTrackedGains
      const currencyBalance = +selectedCurrencyBalance.toFixed(2)
      const stored = +trackingCustom.storedBalance
      return (currencyBalance - stored).toFixed(2)
    }

    return ''
  }, [isTrackingGains, selectedCurrencyBalance, localStorage.getItem(CUSTOM_GAINS_KEY), startTrackingCustom, stopTrackingCustom])

  const startedTrackingAt = () => {
    if (!isTrackingGains) return ''
    const trackingCustom = JSON.parse(localStorage.getItem(CUSTOM_GAINS_KEY)!) as StoredAndTrackedGains
    return moment(trackingCustom.trackingSince).fromNow()
  }

  const callback = () => {
    if (isTrackingGains) {
      stopTrackingCustom()
    } else {
      startTrackingCustom()
    }
  }

  const [gainsUSD, setGainsUSD] = React.useState('-')

  React.useEffect(() => {
    console.log(selectedCurrencyBalance, isTrackingCustom, isTrackingGains)
    if (selectedCurrencyBalance && isTrackingGains) {
      const gains = localStorage.getItem(CUSTOM_GAINS_KEY)
      if (gains) {
        const model = JSON.parse(gains) as StoredAndTrackedGains
        const provider = window.ethereum ? window.ethereum : walletconnect
        const w3 = new Web3(provider as any).eth
        const calc = +(+selectedCurrencyBalance.toFixed(2) - +model.storedBalance).toFixed(0)
        const routerContr = new w3.Contract(routerAbi as any, routerAddress)
        const ten9 = 10 ** 9
        const amount = calc * ten9
        if (amount && amount > 0) {
          const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
            currency.address,
            WETH9[1].address,
            USDC.address,
          ])
          amountsOut.call().then((response: any) => {
            console.log(response)
            const usdc = response[response.length - 1]
            const ten6 = 10 ** 6
            const usdcValue = usdc / ten6
            setGainsUSD(usdcValue.toFixed(2))
          })
        }
      }
    } else {
      setGainsUSD('0.00')
    }
  }, [selectedCurrencyBalance, localStorage.getItem(CUSTOM_GAINS_KEY), isTrackingGains])

  const GainsLabel = styled.label`
    position: absolute;
    right: 50px;
    z-index: 9;
    margin-top: 5px;
    font-size:12px;
  `

  const GainsWrapper = !trumpBalance || (trumpBalance && +trumpBalance.toFixed(2) <= 0) ? DisabledMask : React.Fragment
  const [currencyValue, setCurrencyValue] = React.useState('')
  React.useEffect(() => {
    if (selectedCurrencyBalance && +selectedCurrencyBalance?.toFixed(2) > 0) {
      const provider = window.ethereum ? window.ethereum : walletconnect
      const w3 = new Web3(provider as any).eth;
      const routerContr = new w3.Contract(routerAbi as any, routerAddress);
      const ten9 = 10 ** 9;
      const amount = +selectedCurrencyBalance.toFixed(0) * ten9;
      const address = currency?.address ? currency.address : selectedCurrencyBalance?.currency?.wrapped?.address;
      const amountsOut = routerContr.methods.getAmountsOut(BigInt(amount), [
        address,
        WETH9[1].address,
        USDC.address,
      ]);
      amountsOut.call().then((response: any) => {
        const usdc = response[response.length - 1];
        const ten6 = 10 ** 6;
        const usdcValue = usdc / ten6;
        setCurrencyValue(usdcValue.toFixed(2));
      });
       
      }
    }, [selectedCurrencyBalance, account])
  
  const showWarning = React.useMemo(() => {
   const showWarning = !!account && (!trumpBalance || +trumpBalance?.toFixed(2) <= 0);
 return showWarning;
  }, [trumpBalance, account])
      

  return (
    <GainsWrapper>
      <Card style={{ maxWidth: 600 }}>
        <Wrapper>
          <CardSection>

            <div style={{ paddingLeft: 15, paddingRight: 15 }}>
              <div>
                <h1 style={{filter: 'drop-shadow(2px 4px 6px black)', color:'#fff'}}>GAINSTRACKER &trade;</h1>
                {isTrackingCustom && (
                  <div>
                    <Badge>
                      <Calendar />
                      Started Tracking {startedTrackingAt()}
                    </Badge>
                  </div>
                )}
              </div>
              {!!account && !showWarning && <DarkCard style={{marginBottom: 30, marginTop: 30}}>
 <TYPE.main><small >
                Select a currency, or input the contract address of a project you own that you would like to track redistribution gains. &nbsp;
                <Tooltip show={showTip} text={tipmessage}>
                  <Info onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)} />
                </Tooltip>
              </small>
              </TYPE.main>
</DarkCard>
             } 
             {showWarning && (<BlueCard><React.Fragment>
      <AlertCircle />
      <small>This feature is only avaialable to current holders of Squeeze Token. Please check again at a future
      date or acquire some Squeeze Token to use the universal gains tracking functionality.</small>
    </React.Fragment></BlueCard>)}
             
          {!account &&  <DarkCard><TYPE.main>Connect your wallet to track gains</TYPE.main></DarkCard>}

            </div>
          </CardSection>
          <CardSection>
            <GainsLabel>GAINS ({gainsUSD} USD)</GainsLabel>
            <CurrencyInputPanel
              label={'GAINS'}
              showMaxButton={false}
              value={gains()}
              currency={selectedCurrencyBalance?.currency}
              onUserInput={handleTypeInput}
              showOnlyTrumpCoins={true}
              onMax={undefined}
              fiatValue={undefined}
              onCurrencySelect={handleInputSelect}
              otherCurrency={gains() ? USDC : undefined}
              showCommonBases={false}
              renderBalance={amt => {
                return `Balance: ${(amt.toFixed(0))} (${(+currencyValue).toFixed(2)} USD)`
              }}
              id="swap-currency-input"
            />
          </CardSection>
          {selectedCurrencyBalance && (
            <CardSection>
                {isTrackingGains &&  <TYPE.blue style={{marginBottom:35}}>
                    If you buy or sell, it is recommended to reset your gains tracker to see the most accurate results. 
                </TYPE.blue>}
              <ButtonPrimary onClick={callback}>
                {isTrackingGains ? 'Stop Tracking Gains' : 'Start Tracking Gains'}
              </ButtonPrimary>

              
            </CardSection>
          )}
        </Wrapper>
      </Card>
    </GainsWrapper>
  )
}
