import React from 'react'
import { useTranslation } from 'react-i18next'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { NetworkLabel } from 'src/components/Network/NetworkLabel'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface HeaderProps {
  chainId?: ChainId
  onPressBack: () => void
}

export function Header({ chainId, onPressBack }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <Box p="md" flexDirection="row" justifyContent="space-between">
      <Text variant="h2">{t`Swap`}</Text>
      <Box flexDirection="row" alignContent="center" justifyContent="flex-end" flex={1}>
        {chainId && <NetworkLabel chainId={chainId} />}
        <Button ml="sm" onPress={onPressBack} alignSelf="center">
          <X height={30} width={30} />
        </Button>
      </Box>
    </Box>
  )
}
