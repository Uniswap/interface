import React from 'react'
import { useTranslation } from 'react-i18next'
import { BackX } from 'src/components/buttons/BackX'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface HeaderProps {
  chainId?: ChainId
  onPressBack: () => void
  onPressNetwork: () => void
}

export function Header({ onPressBack }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" px="lg">
      <Text color="textColor" variant="bodyBold">{t`Swap`}</Text>
      <Flex alignContent="center" alignItems="center" flexDirection="row" justifyContent="flex-end">
        <BackX size={16} onPressBack={onPressBack} />
      </Flex>
    </Box>
  )
}
