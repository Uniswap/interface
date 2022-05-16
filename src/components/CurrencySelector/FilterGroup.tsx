import React from 'react'
import { StyleSheet } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import StarIcon from 'src/assets/icons/star.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { NetworkButtonGroup, NetworkButtonType } from 'src/components/Network/NetworkButtonGroup'
import { Pill } from 'src/components/text/Pill'
import { ChainId } from 'src/constants/chains'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'

interface FilterGroupInterface {
  onPressFavorites: () => void
  onPressNetwork: (chainId: ChainId) => void
  onReset: () => void
  resetButtonLabel: string
  selected: ChainId | 'favorites' | 'reset' | null
}

/**
 * Button group used for filtering token lists.
 * Displays buttons for favorites, reset and all supported networks.
 */
export function FilterGroup({
  onPressFavorites,
  onPressNetwork,
  onReset,
  resetButtonLabel,
  selected,
}: FilterGroupInterface) {
  const theme = useAppTheme()

  return (
    <ScrollView
      horizontal
      directionalLockEnabled={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}>
      <Trace section={SectionName.CurrencySelect}>
        <Flex row gap="none">
          <Button mr="sm" name={ElementName.FavoritesFilter} onPress={onPressFavorites}>
            <Pill
              backgroundColor="neutralSurface"
              borderColor={selected === 'favorites' ? 'neutralOutline' : 'neutralSurface'}
              foregroundColor={theme.colors.deprecated_textColor}
              height={36}
              icon={
                <StarIcon
                  fill={theme.colors.deprecated_yellow}
                  height={20}
                  stroke={theme.colors.deprecated_yellow}
                  width={20}
                />
              }
              label=""
            />
          </Button>
          <Button mr="sm" name={ElementName.Reset} onPress={onReset}>
            <Pill
              backgroundColor="neutralSurface"
              borderColor={selected === 'reset' ? 'neutralOutline' : 'neutralSurface'}
              foregroundColor={theme.colors.deprecated_textColor}
              height={36}
              label={resetButtonLabel}
            />
          </Button>
          <NetworkButtonGroup
            selected={typeof selected === 'string' ? null : selected}
            type={NetworkButtonType.PILL}
            onPress={onPressNetwork}
          />
        </Flex>
      </Trace>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    overflow: 'visible',
  },
})
