import React, { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import WalletIcon from 'src/assets/icons/wallet-filled.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { CheckBox } from 'src/components/buttons/CheckBox'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { useAccountListQuery } from 'src/data/__generated__/types-and-hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { dimensions, spacing } from 'src/styles/sizing'
import { opacify } from 'src/utils/colors'
import { formatUSDPrice } from 'src/utils/format'

const ADDRESS_ROW_HEIGHT = 40

export type RemoveSeedPhraseWarningModalProps = {
  associatedAccounts: Account[]
  onRemoveWallet?: () => void
  onClose?: () => void
}
export default function RemoveSeedPhraseWarningModal({
  associatedAccounts,
  onRemoveWallet,
  onClose,
}: RemoveSeedPhraseWarningModalProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const { data, loading } = useAccountListQuery({
    variables: {
      addresses: associatedAccounts.map((account) => account.address),
    },
    notifyOnNetworkStatusChange: true,
  })

  const [showInitialWarning, setShowInitialWarning] = useState(true)
  const [checkBoxAccepted, setCheckBoxAccepted] = useState(false)

  const totalBalanceAtIndex = useCallback(
    (index: number) => data?.portfolios?.at(index)?.tokensTotalDenominatedValue?.value,
    [data?.portfolios]
  )

  const sortedAddressesByBalance = associatedAccounts
    .map((account, index) => ({
      address: account.address,
      balance: totalBalanceAtIndex(index),
    }))
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))

  // set max height to around 30% screen size, but so we always cut the last visible element
  // this way user is aware if there are more elements to see
  const accountsScrollViewHeight =
    Math.floor((dimensions.fullHeight * 0.3) / ADDRESS_ROW_HEIGHT) * ADDRESS_ROW_HEIGHT +
    ADDRESS_ROW_HEIGHT / 2 +
    spacing.spacing12 // 12 is the ScrollView vertical padding

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.background1}
      name={ModalName.RemoveSeedPhraseWarningModal}
      onClose={onClose}>
      <Flex centered gap="spacing16" height="100%" mb="spacing24" p="spacing24">
        <Flex
          centered
          borderRadius="rounded12"
          p="spacing12"
          style={{
            backgroundColor: opacify(
              12,
              theme.colors[showInitialWarning ? 'textSecondary' : 'accentCritical']
            ),
          }}>
          {showInitialWarning ? (
            <WalletIcon
              color={theme.colors.textSecondary}
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          ) : (
            <AlertTriangleIcon
              color={theme.colors.accentCritical}
              height={theme.iconSizes.icon24}
              width={theme.iconSizes.icon24}
            />
          )}
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {showInitialWarning ? (
            t('Import a new wallet')
          ) : (
            <Trans t={t}>
              You’re removing your <Text color="accentCritical">recovery phrase</Text>
            </Trans>
          )}
        </Text>
        <Text color="textSecondary" textAlign="center" variant="bodySmall">
          {showInitialWarning ? (
            t(
              'You can only store one recovery phrase at a time. To continue importing a new one, you’ll need to remove your current recovery phrase and any associated wallets from this device.'
            )
          ) : (
            <Trans t={t}>
              Make sure you’ve written down your recovery phrase or backed it up on iCloud.{' '}
              <Text color="textSecondary" variant="buttonLabelSmall">
                You will not be able to access your funds otherwise.
              </Text>
            </Trans>
          )}
        </Text>
        {showInitialWarning ? (
          <Flex centered row gap="spacing12" pt="spacing12">
            <Button fill emphasis={ButtonEmphasis.Tertiary} label={t('Cancel')} onPress={onClose} />
            <Button
              fill
              emphasis={ButtonEmphasis.Secondary}
              label={t('Continue')}
              name={ElementName.Continue}
              onPress={(): void => setShowInitialWarning(false)}
            />
          </Flex>
        ) : (
          <>
            <Box
              borderColor="backgroundOutline"
              borderRadius="rounded16"
              borderWidth={1}
              maxHeight={accountsScrollViewHeight}
              mb="spacing16"
              px="spacing12"
              width="100%">
              <ScrollView bounces={false} contentContainerStyle={styles.accounts}>
                {sortedAddressesByBalance.map(({ address, balance }, index) => (
                  <Flex
                    key={address}
                    row
                    alignItems="center"
                    justifyContent="space-between"
                    pb={index !== associatedAccounts.length - 1 ? 'spacing16' : undefined}>
                    <AddressDisplay
                      hideAddressInSubtitle
                      address={address}
                      size={24}
                      variant="subheadSmall"
                    />
                    <Text
                      color="textTertiary"
                      loading={loading}
                      numberOfLines={1}
                      variant="buttonLabelMicro">
                      {formatUSDPrice(balance)}
                    </Text>
                  </Flex>
                ))}
              </ScrollView>
            </Box>
            <Box
              backgroundColor="background2"
              borderRadius="rounded16"
              mx="spacing16"
              px="spacing8"
              py="spacing12">
              <CheckBox
                checked={checkBoxAccepted}
                text={
                  <Box>
                    <Trans t={t}>
                      <Text color="textPrimary" variant="subheadSmall">
                        I backed up my recovery phrase
                      </Text>
                      <Text color="textSecondary" variant="bodySmall">
                        I understand that Uniswap Labs can’t help me recover my wallets if I failed
                        to do so
                      </Text>
                    </Trans>
                  </Box>
                }
                onCheckPressed={(): void => setCheckBoxAccepted(!checkBoxAccepted)}
              />
            </Box>
            <Flex centered row gap="spacing12" pt="spacing12">
              <Button
                fill
                disabled={!checkBoxAccepted}
                emphasis={ButtonEmphasis.Detrimental}
                label={t('Remove wallet')}
                name={ElementName.Confirm}
                onPress={onRemoveWallet}
              />
            </Flex>
          </>
        )}
      </Flex>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  accounts: {
    paddingVertical: spacing.spacing12,
  },
})
