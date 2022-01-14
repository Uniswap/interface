import React from 'react'
import { useTranslation } from 'react-i18next'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { NetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface HeaderProps {
  chainId?: ChainId
  onPressBack: () => void
  onPressNetwork: () => void
}

export function Header({ chainId, onPressBack, onPressNetwork }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="lg">
      <Text variant="h3">{t`Swap`}</Text>
      <Box alignContent="center" flex={1} flexDirection="row" justifyContent="flex-end">
        {chainId && (
          <Button alignSelf="center" ml="md" onPress={onPressNetwork}>
            <NetworkPill chainId={chainId} />
          </Button>
        )}
        <Button alignSelf="center" ml="md" onPress={onPressBack}>
          <X height={20} width={20} />
        </Button>
      </Box>
    </Box>
  )
}
