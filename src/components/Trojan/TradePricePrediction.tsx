import React from 'react'
import { useContext, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { StyledBalanceMaxMini } from 'pages/Trojan/styleds'
import { ThemeContext } from 'styled-components'

interface TradePricePredictionProps {
  formattedPriceFrom: string
  formattedPriceTo: string
  label: string
  labelInverted: string
}

export default function TradePricePrediction({
  formattedPriceFrom,
  formattedPriceTo,
  label,
  labelInverted
}: TradePricePredictionProps) {
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const theme = useContext(ThemeContext)

  const formattedPrice = showInverted ? formattedPriceFrom : formattedPriceTo
  const labelFormatted = showInverted ? label : labelInverted

  return (
    <Text
      fontWeight={500}
      fontSize={14}
      color={theme.text1}
      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
    >
      {formattedPrice ?? '-'} {labelFormatted}
      <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
        <Repeat size={14} />
      </StyledBalanceMaxMini>
    </Text>
  )
}
