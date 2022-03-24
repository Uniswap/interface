import Badge, { BadgeVariant } from 'components/Badge'
import { CardBGImage, CardSection } from 'components/earn/styled'

import { DarkCard } from 'components/Card'
import React from 'react'
import { SupportedChainId } from 'constants/chains'
import { Token } from '@uniswap/sdk-core'
import {Zap} from 'react-feather'
import { useCurrency } from 'hooks/Tokens'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useKiba } from 'pages/Vote/VotePage'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useWeb3React } from '@web3-react/core'

function abbreviateNumber(value: any) {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
      }).format(value)
}
export const BurntKiba = ({showDetails}:{showDetails?:boolean}) => {
    const deadWalletKibaBalance = useKiba('0x000000000000000000000000000000000000dead')
    const { chainId} = useWeb3React()
    const isBinance = React.useMemo(() => chainId === SupportedChainId.BINANCE, [chainId]);
    const kibaCoin = React.useMemo(() => new Token(
      isBinance ? 56 : 1,
      isBinance ? '0xC3afDe95B6Eb9ba8553cDAea6645D45fB3a7FAF5' : "0x005d1123878fc55fbd56b54c73963b234a64af3c",
      18,
      "Kiba",
      "Kiba Inu"
    ), [isBinance])
    const kibaCurrency = useCurrency(kibaCoin.address)
    const currencyBalance =useCurrencyBalance('0x000000000000000000000000000000000000dead', kibaCurrency ?? undefined)
    console.log(deadWalletKibaBalance?.toFixed(18))
    const burntValue = useUSDCValue(currencyBalance)
    return (
        deadWalletKibaBalance ? 
        showDetails ? 
            <DarkCard>
                <h1>Burnt Kiba {isBinance ? "(BSC)" : "(ETH)"}</h1>
                <CardBGImage desaturate>

                </CardBGImage>
                <p style={{color: '#F76C1D'}}>{abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}   <small>({(Number(+deadWalletKibaBalance.toFixed(18)).toLocaleString())}) Tokens</small></p>
               {burntValue && <p style={{color: '#F76C1D'}}><Badge>Burnt Value ${Number(burntValue?.toFixed(2)).toLocaleString()} USD</Badge></p>}
              
            </DarkCard> :
            <Badge style={{backgroundPosition: 'center center',backgroundSize: 'contain'}} variant={BadgeVariant.DEFAULT}> <Zap /> {abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</Badge> : null
    )
}