import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useEvent } from 'utilities/src/react/hooks'

export const WalletRestoreButton = (): JSX.Element => {
  const { t } = useTranslation()
  const { openWalletRestoreModal } = useTransactionModalContext()

  const onRestorePress = useEvent((): void => {
    if (!openWalletRestoreModal) {
      throw new Error('Invalid call to `onRestorePress` with missing `openWalletRestoreModal`')
    }
    openWalletRestoreModal()
  })

  return (
    <TouchableArea onPress={onRestorePress}>
      <Flex
        grow
        row
        alignItems="center"
        alignSelf="stretch"
        backgroundColor="$surface2"
        borderBottomLeftRadius="$rounded16"
        borderBottomRightRadius="$rounded16"
        borderTopColor="$surface1"
        borderTopWidth={1}
        gap="$spacing8"
        px="$spacing12"
        py="$spacing12"
      >
        <InfoCircleFilled color="$statusWarning" size="$icon.20" />
        <Text color="$statusWarning" variant="subheading2">
          {t('swap.form.warning.restore')}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
