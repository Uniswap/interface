import React from 'react'
import { Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import {
  SafetyLevel,
  TokenDetailsScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const token = data?.token
  const tokenProject = token?.project
  const shouldShowWarningIcon =
    !tokenProtectionEnabled &&
    (tokenProject?.safetyLevel === SafetyLevel.StrongWarning || tokenProject?.safetyLevel === SafetyLevel.Blocked)
  return (
    <Flex gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token?.chain) ?? undefined}
        name={token?.name ?? undefined}
        symbol={token?.symbol ?? undefined}
        url={tokenProject?.logoUrl ?? undefined}
      />
      <Flex row alignItems="center" gap="$spacing8">
        <Text
          color="$neutral1"
          loading={loading}
          numberOfLines={1}
          style={flexStyles.shrink}
          testID={TestID.TokenDetailsHeaderText}
          variant="subheading1"
        >
          {token?.name ?? '—'}
        </Text>
        {shouldShowWarningIcon && (
          <TouchableArea onPress={onPressWarningIcon}>
            <WarningIcon safetyLevel={tokenProject?.safetyLevel} size="$icon.20" strokeColorOverride="$neutral3" />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
