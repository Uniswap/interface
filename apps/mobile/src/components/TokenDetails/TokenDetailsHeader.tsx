import React, { memo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, flexStyles, Text, TouchableArea } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const TokenDetailsHeader = memo(function _TokenDetailsHeader(): JSX.Element {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)

  const { currencyId, openTokenWarningModal } = useTokenDetailsContext()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data
  const project = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const shouldShowWarningIcon =
    !tokenProtectionEnabled &&
    (project?.safetyLevel === SafetyLevel.StrongWarning || project?.safetyLevel === SafetyLevel.Blocked)

  return (
    <Flex gap="$spacing12" mx="$spacing16">
      <TokenLogo
        chainId={fromGraphQLChain(token?.chain) ?? undefined}
        name={token?.name ?? undefined}
        symbol={token?.symbol ?? undefined}
        url={project?.logoUrl ?? undefined}
      />

      <Flex row alignItems="center" gap="$spacing8">
        <Text
          color="$neutral1"
          numberOfLines={1}
          style={flexStyles.shrink}
          testID={TestID.TokenDetailsHeaderText}
          variant="subheading1"
        >
          {token?.name ?? '—'}
        </Text>

        {shouldShowWarningIcon && (
          <TouchableArea onPress={openTokenWarningModal}>
            <WarningIcon safetyLevel={project?.safetyLevel} size="$icon.20" strokeColorOverride="$neutral3" />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
})
