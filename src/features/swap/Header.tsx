import React from 'react'
import { useTranslation } from 'react-i18next'
import { BackX } from 'src/components/buttons/BackX'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
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
      <Text color="gray400" variant="h4">{t`Swap`}</Text>
      <Flex
        alignContent="center"
        alignItems="center"
        flexDirection="row"
        gap="sm"
        justifyContent="flex-end">
        {chainId && (
          <Button alignSelf="center" onPress={onPressNetwork}>
            <NetworkPill chainId={chainId} />
          </Button>
        )}
        <BackX size={14} onPressBack={onPressBack} />
      </Flex>
    </Box>
  )
}
