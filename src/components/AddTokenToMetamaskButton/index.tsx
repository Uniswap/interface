import React from 'react'
import styled from 'styled-components'
import { Currency, Token } from '@fuseio/fuse-swap-sdk'
import { ButtonPrimaryLightStyle } from '../Button'
import metamaskIcon from '../../assets/images/metamask.png'
import { addTokenToWallet } from '../../utils'
import { useActiveWeb3React } from '../../hooks'

interface AddTokenMetamaskProps {
  currency?: Currency
}

const MetamaskIcon = styled.img.attrs({
  src: metamaskIcon
})`
  width: 18px;
  margin-left: 8px;
`

export default function AddTokenToMetamaskButton({ currency }: AddTokenMetamaskProps) {
  const { library } = useActiveWeb3React()

  return currency instanceof Token && library ? (
    <ButtonPrimaryLightStyle onClick={() => addTokenToWallet(currency, library)}>
      Add {currency?.symbol} to Metamask <MetamaskIcon />
    </ButtonPrimaryLightStyle>
  ) : null
}
