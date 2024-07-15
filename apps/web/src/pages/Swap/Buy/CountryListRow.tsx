import Row from 'components/Row'
import styled, { CSSProperties } from 'lib/styled-components'
import { ApprovedCheckmarkIcon } from 'nft/components/icons'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'

const RowWrapper = styled(Row)`
  height: 60px;
  padding: 0 20px;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.surface2};
  }
`

const StyledImage = styled.img`
  border-radius: 50%;
`

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
    <RowWrapper style={style} onClick={onClick}>
      <Row gap="md">
        <StyledImage
          src={countryFlagUrl}
          alt={country.countryCode}
          height={iconSizes.icon32}
          width={iconSizes.icon32}
        />
        <Text variant="body2">{country.displayName}</Text>
      </Row>
      {selectedCountry?.countryCode === country.countryCode && <ApprovedCheckmarkIcon height={24} width={24} />}
    </RowWrapper>
  )
}
