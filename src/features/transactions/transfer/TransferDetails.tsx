import React from 'react'
import { useTranslation } from 'react-i18next'
import * as Progress from 'react-native-progress'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useUSDGasPrice } from 'src/features/gas/hooks'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'
import { formatUSDPrice } from 'src/utils/format'

export function TransferDetails({
  chainId,
  gasFee,
}: {
  chainId: ChainId | undefined
  gasFee: string | undefined
}) {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()

  const price = useUSDGasPrice(chainId, gasFee)
  const totalNetworkFee = price ? formatUSDPrice(price.toString()) : undefined

  return (
    <AnimatedFlex
      bg="translucentBackground"
      borderRadius="lg"
      entering={FadeIn}
      exiting={FadeOut}
      gap="xxxs">
      <Flex gap="sm" p="md">
        <Flex row gap="sm" justifyContent="space-between">
          <Text color="textPrimary" variant="bodySmall">
            {t('Network fee')}
          </Text>
          <Box>
            {totalNetworkFee ? (
              <Text variant="bodySmall">{totalNetworkFee}</Text>
            ) : (
              <Progress.CircleSnail direction={'clockwise'} size={20} thickness={2.5} />
            )}
          </Box>
        </Flex>
      </Flex>
      <Separator />
      <Flex row shrink gap="sm" justifyContent="space-between" p="sm">
        <AddressDisplay
          address={activeAddress}
          showNotificationBadge={false}
          size={20}
          variant="bodySmall"
          verticalGap="none"
        />
        <Flex centered row shrink gap="xs">
          <Text color="textSecondary" variant="bodySmall">
            {shortenAddress(activeAddress)}
          </Text>
        </Flex>
      </Flex>
      <Box />
    </AnimatedFlex>
  )
}
