import React from 'react'
import { Flex, Separator, Text, Unicon, UniconV2, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

type Props = {
  account: Account
  activeAccount: Account | null
}

const ICON_SIZE = 24

export const SwitchAccountOption = ({ account, activeAccount }: Props): JSX.Element => {
  const colors = useSporeColors()
  const isUniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)

  const displayName = useDisplayName(account.address)
  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing8">
        {isUniconsV2Enabled ? (
          <UniconV2 address={account.address} size={ICON_SIZE} />
        ) : (
          <Unicon address={account.address} size={ICON_SIZE} />
        )}
        <Flex shrink alignItems="center" p="$none">
          <DisplayNameText
            displayName={displayName}
            textProps={{ variant: 'body1', testID: `address-display/name/${displayName?.name}` }}
          />
          <Text color="$neutral2" variant="subheading2">
            {shortenAddress(account.address)}
          </Text>
        </Flex>
        <Flex height={ICON_SIZE} width={ICON_SIZE}>
          {activeAccount?.address === account.address && (
            <Check color={colors.accent1.get()} height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
