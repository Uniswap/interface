import React from 'react'
import { Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { iconSizes, imageSizes } from 'ui/src/theme'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'wallet/src/components/icons/WarningIcon'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'

export interface TokenDetailsHeaderProps {
  data?: TokenDetailsScreenQuery
  loading?: boolean
  onPressWarningIcon: () => void
}

export function TokenDetailsHeader({
  data,
  loading = false,
  onPressWarningIcon,
}: TokenDetailsHeaderProps): JSX.Element {
  const token = data?.token
  const tokenProject = token?.project

  return (
    <Flex gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token?.chain) ?? undefined}
        name={token?.project?.name ?? undefined}
        symbol={token?.symbol ?? undefined}
        url={tokenProject?.logoUrl ?? undefined}
      />
      <Flex row alignItems="center" gap="$spacing8">
        <Text
          color="$neutral1"
          loading={loading}
          numberOfLines={1}
          style={flexStyles.shrink}
          variant="subheading1">
          {tokenProject?.name ?? '—'}
        </Text>
        {/* Suppress warning icon on low warning level */}
        {(tokenProject?.safetyLevel === SafetyLevel.StrongWarning ||
          tokenProject?.safetyLevel === SafetyLevel.Blocked) && (
          <TouchableArea onPress={onPressWarningIcon}>
            <WarningIcon
              height={iconSizes.icon20}
              safetyLevel={tokenProject?.safetyLevel}
              strokeColorOverride="neutral3"
              width={imageSizes.image20}
            />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
