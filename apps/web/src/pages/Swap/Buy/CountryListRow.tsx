import { CSSProperties } from 'react'
import { Avatar, Flex, styled } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'

const RowWrapper = styled(Flex, {
  row: true,
  height: '$spacing60',
  px: '$spacing20',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$surface2',
  },
})

interface CountryRowProps {
  country?: FORCountry
  style: CSSProperties
  selectedCountry?: FORCountry
  onClick: () => void
}

export function CountryListRow({ style, country, selectedCountry, onClick }: CountryRowProps) {
  if (!country) {
    return null
  }
  const countryFlagUrl = getCountryFlagSvgUrl(country.countryCode)
  return (
    <RowWrapper style={style} onPress={onClick}>
      <Flex row alignItems="center" gap="$spacing12">
        <Avatar circular size={iconSizes.icon32}>
          <Avatar.Image accessibilityLabel="Country flag" src={countryFlagUrl} alt={country.countryCode} />
          <Avatar.Fallback backgroundColor="$neutral3" />
        </Avatar>
        <Text variant="body2">{country.displayName}</Text>
      </Flex>
      {selectedCountry?.countryCode === country.countryCode && <Check color="$neutral1" size="$icon.24" />}
    </RowWrapper>
  )
}
