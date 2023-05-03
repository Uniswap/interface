import { default as React, useMemo } from 'react'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { useActiveChainIds } from 'src/features/chains/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { iconSizes } from 'src/styles/sizing'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

export function useNetworkOptions(
  selectedChain: ChainId | null,
  onPress: (chainId: ChainId | null) => void
): { key: string; onPress: () => void; render: () => JSX.Element }[] {
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
                <Flex centered height={iconSizes.icon24} width={iconSizes.icon24}>
                  {selectedChain === chainId && (
                    <Box
                      bg="accentSuccess"
                      borderRadius="roundedFull"
                      height={iconSizes.icon8}
                      width={iconSizes.icon8}
                    />
                  )}
                </Flex>
              </Flex>
            </>
          ),
        }
      }),
    [activeChains, onPress, selectedChain]
  )
}
