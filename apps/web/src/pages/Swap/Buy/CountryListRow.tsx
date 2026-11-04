import { Flex, type FlexCompatProps, Text, iconSizes } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { CSSProperties, forwardRef, type ForwardRefExoticComponent, type RefAttributes, useState } from 'react'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const RowWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function RowWrapper({ hoverStyle, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      row
      height="$spacing60"
      px="$spacing20"
      justifyContent="space-between"
      alignItems="center"
      cursor="pointer"
      // Merged explicitly, not spread: a plain spread would replace this base wholesale.
      hoverStyle={{ backgroundColor: '$surface2', ...hoverStyle }}
      {...props}
    />
  )
})

interface CountryRowProps {
  country?: FORCountry
  style: CSSProperties
  selectedCountry?: FORCountry
  onClick: () => void
}

export function CountryListRow({ style, country, selectedCountry, onClick }: CountryRowProps) {
  // A failed flag load leaves only the fallback circle, like the legacy Avatar.Fallback
  const [flagFailed, setFlagFailed] = useState(false)
  if (!country) {
    return null
  }
  const countryFlagUrl = getCountryFlagSvgUrl(country.countryCode)
  return (
    <RowWrapper style={style} onPress={onClick}>
      <Flex row alignItems="center" gap="$spacing12">
        {/* The legacy Avatar compound as a plain flag image over its $neutral3 fallback circle */}
        <Flex
          width={iconSizes.icon32}
          height={iconSizes.icon32}
          borderRadius="$roundedFull"
          backgroundColor="$neutral3"
          overflow="hidden"
        >
          {!flagFailed && (
            <img
              aria-label="Country flag"
              alt={country.countryCode}
              src={countryFlagUrl}
              width={iconSizes.icon32}
              height={iconSizes.icon32}
              style={{ objectFit: 'cover' }}
              onError={() => setFlagFailed(true)}
            />
          )}
        </Flex>
        <Text variant="body2">{country.displayName}</Text>
      </Flex>
      {selectedCountry?.countryCode === country.countryCode && <Check color="$neutral1" size="$icon.24" />}
    </RowWrapper>
  )
}
