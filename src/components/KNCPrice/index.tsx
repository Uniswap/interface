import { ChainId } from '@kyberswap/ks-sdk-core'
import React from 'react'

import Loader from 'components/Loader'
import { KNC_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useKNCPrice } from 'state/application/hooks'
import { formattedNum, getTokenLogoURL } from 'utils'

import { KNCPriceContainer, KNCPriceWrapper } from './styleds'

export default function KNCPice() {
  const { chainId } = useActiveWeb3React()
  const kncPrice = useKNCPrice()

  if (chainId && chainId === ChainId.AVAXMAINNET) {
    return null
  }

  return (
    <KNCPriceContainer>
      {kncPrice ? (
        <KNCPriceWrapper>
          <img src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`} alt="knc-logo" width="20px" height="20px" />
          {formattedNum(kncPrice, true)}
        </KNCPriceWrapper>
      ) : (
        <Loader />
      )}
    </KNCPriceContainer>
  )
}
