import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'

interface HeaderProps {
  chainId?: ChainId
  onPressBack: () => void
}

export function Header({ chainId, onPressBack }: HeaderProps) {
  const chainDescriptor = chainId ? CHAIN_INFO[chainId] : undefined

  const { t } = useTranslation()

  return (
    <Box p="md" flexDirection="row" justifyContent="space-between">
      <Text variant="h2">{t`Swap`}</Text>
      <Box flexDirection="row" alignContent="center" justifyContent="flex-end" flex={1}>
        {chainDescriptor && (
          <Button borderRadius="xs">
            {chainDescriptor.logoUrl && (
              <Image source={{ uri: chainDescriptor.logoUrl }} height={40} width={40} />
            )}
            <Text variant="body" color="primary1">
              {chainDescriptor.label}
            </Text>
          </Button>
        )}
        <Button onPress={onPressBack} alignSelf="center">
          <X height={30} width={30} />
        </Button>
      </Box>
    </Box>
  )
}
