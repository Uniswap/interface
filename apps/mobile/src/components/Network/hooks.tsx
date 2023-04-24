import { default as React, useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { iconSizes } from 'src/styles/sizing'

export function useNetworkOptions(
  selectedChain: ChainId | null,
  onPress: (chainId: ChainId | null) => void
): { key: string; onPress: () => void; render: () => JSX.Element }[] {
  const theme = useAppTheme()
  const activeChains = useActiveChainIds()

  return useMemo(
    () =>
      activeChains.map((chainId) => {
        const info = CHAIN_INFO[chainId]
        return {
          key: `${ElementName.NetworkButton}-${chainId}`,
          onPress: () => onPress(chainId),
          render: () => (
            <>
              <Separator />
              <Flex
                row
                alignItems="center"
                justifyContent="space-between"
                px="spacing24"
                py="spacing16">
                <NetworkLogo chainId={chainId} size={iconSizes.icon24} />
                <Text color="textPrimary" variant="bodyLarge">
                  {info.label}
                </Text>
                <Box height={iconSizes.icon20} width={iconSizes.icon20}>
                  {selectedChain === chainId && (
                    <Check
                      color={theme.colors.accentActive}
                      height={iconSizes.icon20}
                      width={iconSizes.icon20}
                    />
                  )}
                </Box>
              </Flex>
            </>
          ),
        }
      }),
    [activeChains, onPress, selectedChain, theme.colors.accentActive]
  )
}
