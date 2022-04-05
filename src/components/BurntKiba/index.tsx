import Badge, { BadgeVariant } from 'components/Badge'
import { CardBGImage, CardSection } from 'components/earn/styled'
import { LinkStyledButton, StyledInternalLink } from 'theme'
import { useKiba, useKibaBalanceUSD } from 'pages/Vote/VotePage'

import { DarkCard } from 'components/Card'
import React from 'react'
import { SupportedChainId } from 'constants/chains'
import { Token } from '@uniswap/sdk-core'
import {Zap} from 'react-feather'
import { useCurrency } from 'hooks/Tokens'
import { useCurrencyBalance } from 'state/wallet/hooks'
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
      isBinance ? '0xc3afde95b6eb9ba8553cdaea6645d45fb3a7faf5' : "0x005d1123878fc55fbd56b54c73963b234a64af3c",
      18,
      "Kiba",
      "Kiba Inu"
    ), [isBinance])
    const kibaCurrency = useCurrency(kibaCoin.address)
    const currencyBalance =useCurrencyBalance('0x000000000000000000000000000000000000dead', kibaCurrency ?? undefined)
    console.log(deadWalletKibaBalance?.toFixed(18))
    const burntValue = useUSDCValue(currencyBalance)
    const bscBurntValue = useKibaBalanceUSD('0x000000000000000000000000000000000000dead', chainId)

    return (
        deadWalletKibaBalance ? 
        showDetails ? 
            <DarkCard>
                <h1>Burnt Kiba {isBinance ? "(BSC)" : "(ETH)"}</h1>
                <CardBGImage desaturate>

                </CardBGImage>
                <p style={{color: '#F76C1D'}}>{abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}   <small>({(Number(+deadWalletKibaBalance.toFixed(18)).toLocaleString())}) Tokens</small></p>
               {burntValue && isBinance === false && <p style={{color: '#F76C1D'}}><Badge>Burnt Value ${Number(burntValue?.toFixed(2)).toLocaleString()} USD</Badge></p>}
               {bscBurntValue && isBinance === true && <p style={{color: '#F76C1D'}}><Badge>Burnt Value ${bscBurntValue} USD</Badge></p>}
            </DarkCard> :
            <StyledInternalLink to="/dashboard">
                <Badge   style={{color: '#fff', background: 'url(https://bestanimations.com/media/flames/1396965048fire-flames-sparks-billowing-animated-gif-image.gif)', backgroundPosition: 'center center',backgroundSize: 'contain'}} variant={BadgeVariant.DEFAULT}> {abbreviateNumber(+deadWalletKibaBalance.toFixed(2))}</Badge>
            </StyledInternalLink> : null
    )
}