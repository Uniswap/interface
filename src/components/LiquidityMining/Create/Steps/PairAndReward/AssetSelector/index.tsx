import { Currency } from '@swapr/sdk'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { TYPE } from '../../../../../../theme'
import CurrencyLogo from '../../../../../CurrencyLogo'
import DoubleCurrencyLogo from '../../../../../DoubleLogo'
import { Box, Flex } from 'rebass'
import { GradientCard } from '../../../../../Card'

const Card = styled(GradientCard)`
  width: 100%;
  padding: 13px 20px;
  border: solid 1px ${props => props.theme.bg3};
`

interface AssetLogoProps {
  currency0?: Currency | null
  currency1?: Currency | null
}

function AssetLogo({ currency0, currency1 }: AssetLogoProps) {
  if (currency0 && currency1) {
    return <DoubleCurrencyLogo size={26} currency0={currency0} currency1={currency1} />
  } else if (currency0) {
    return <CurrencyLogo size="26px" currency={currency0} />
  } else {
    return null
  }
}

interface AssetSelectorProps {
  title: string
  currency0?: Currency | null
  currency1?: Currency | null
  onClick: (event: React.MouseEvent<HTMLElement>) => void
}

export default function AssetSelector({ title, currency0, currency1, onClick }: AssetSelectorProps) {
  const [assetTitle, setAssetTitle] = useState<string | null>(null)

  useEffect(() => {
    if (currency0 && currency1) {
      setAssetTitle(`${currency0.symbol}/${currency1.symbol}`)
    } else if (currency0?.symbol) {
      setAssetTitle(currency0.symbol)
    }
  }, [currency0, currency1])

  return (
    <Flex flexDirection="column">
      <Box mb="16px">
        <TYPE.small fontWeight="600" color="text4" letterSpacing="0.08em">
          {title}
        </TYPE.small>
      </Box>
      <Box>
        <Card selectable onClick={onClick}>
          <Flex height="26px" width="100%" justifyContent="center" alignItems="center">
            <Box mr={currency0 ? '8px' : '0'}>
              <AssetLogo currency0={currency0} currency1={currency1} />
            </Box>
            <Box>
              <TYPE.body lineHeight="20px" color="white">
                {assetTitle || 'Click to select'}
              </TYPE.body>
            </Box>
          </Flex>
        </Card>
      </Box>
    </Flex>
  )
}
