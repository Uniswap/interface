import { BuySellTax } from 'pages/Charts/BuySellTax'
import Card from 'components/Card'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import React from 'react'
import { SwapTokenForToken } from 'pages/Swap/SwapTokenForToken'
import { TYPE } from 'theme'
import { Token } from 'state/transactions/hooks'
import { WETH9 } from '@uniswap/sdk-core'
import { X } from 'react-feather'
import { useBuySellTax } from 'pages/Charts/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useDexscreenerToken } from 'components/swap/ChartPage'
import { useIsEmbedMode } from 'components/Header'
import { useLocation } from 'react-router'
import useTheme from 'hooks/useTheme'
type Props = {
    isOpen: boolean
    onDismiss: () => void
    item: Token
}

export const SwapTokenForTokenComponent = () => {
    const embedModel = useIsEmbedMode()
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const outputCurrencyAddress = params.get('tokenAddress') || null
    const item = {
        screenerToken: useDexscreenerToken(outputCurrencyAddress || '')
    }
    const onDismiss = () =>  history.pushState('', '', '/#/swap')

    const [inputCurrency, outputCurrency] = [
        useCurrency(item?.screenerToken?.quoteToken?.address || 'ETH'),
        useCurrency(item?.screenerToken?.baseToken?.address || outputCurrencyAddress || '')
    ]
    const theme = useTheme()

    const buySellTax = useBuySellTax(item?.screenerToken?.baseToken?.address as string, item?.screenerToken?.chainId || 'ethereum')
    if (!embedModel.embedMode || !outputCurrencyAddress) return null;

    return (
        <Modal maxHeight={210} isOpen={true} onDismiss={onDismiss}>
            <Card style={{color: theme.text1, background: theme.bg0, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TYPE.main>Swap {item?.screenerToken?.quoteToken?.symbol}/{item?.screenerToken?.baseToken?.symbol} </TYPE.main>
                    <TYPE.small>On Kibaswap<img src={'https://kibaswap.io/static/media/download.e893807d.png'} style={{marginLeft:3,maxWidth:40}} /></TYPE.small>
                </div>
                <hr />
                {Boolean(inputCurrency) && Boolean(outputCurrency) ? (
                    <React.Fragment>
                        <BuySellTax buySellTax={buySellTax} />
                        <SwapTokenForToken
                            fontSize={12}
                            allowSwappingOtherCurrencies={![inputCurrency, outputCurrency].every(currency => Boolean(currency) && Boolean(currency?.decimals || false) && (currency?.decimals || 0) > 0)}
                            outputCurrency={inputCurrency}
                            inputCurrency={outputCurrency}
                        />
                    </React.Fragment>
                ) : <TYPE.small>Loading swap parameters &nbsp;<Loader /> </TYPE.small>}
            </Card>

        </Modal>
    )

}

export const SwapTokenForTokenModal = (props: Props) => {
    const { isOpen, onDismiss, item } = props
    const [inputCurrency, outputCurrency] = [
        useCurrency(item?.screenerToken?.quoteToken?.address || 'ETH'),
        useCurrency(item?.screenerToken?.baseToken?.address || item?.addr)
    ]

    const buySellTax = useBuySellTax(item?.screenerToken?.baseToken?.address as string, item?.network)

    return isOpen ? (
        <Modal maxHeight={210} isOpen={isOpen} onDismiss={onDismiss}>
            <Card style={{ padding: '1rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TYPE.main>Swap {item?.screenerToken?.quoteToken?.symbol || inputCurrency?.symbol}/{item?.screenerToken?.baseToken?.symbol || outputCurrency?.symbol} </TYPE.main>
                    <X size={18} onClick={onDismiss} style={{ cursor: 'pointer' }} />
                </div>
                <hr />
                {Boolean(inputCurrency) && Boolean(outputCurrency) ? (
                    <React.Fragment>
                        <BuySellTax buySellTax={buySellTax} />
                        <SwapTokenForToken
                            fontSize={12}
                            allowSwappingOtherCurrencies={![inputCurrency, outputCurrency].every(currency => Boolean(currency) && Boolean(currency?.decimals || false) && (currency?.decimals || 0) > 0)}
                            outputCurrency={inputCurrency}
                            inputCurrency={outputCurrency}
                        />
                    </React.Fragment>
                ) : <TYPE.small>Loading swap parameters &nbsp;<Loader /> </TYPE.small>}
            </Card>

        </Modal>
    ) : null
}