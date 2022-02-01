import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { AccountStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ImportAccountForm } from 'src/features/import/ImportAccountForm'
import { NameAccountForm } from 'src/features/import/NameAccountForm'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

export function ImportAccountScreen({ navigation }: AccountStackScreenProp<Screens.ImportAccount>) {
  const [importDone, setImportDone] = useState(false)

  // Note, once an account is imported it is activated
  // So using this to retrieve address of new imported account
  const activeAccount = useActiveAccount()

  const onImportSuccess = () => {
    setImportDone(true)
  }

  const onNamingSuccess = () => {
    navigation.navigate(Screens.Accounts)
  }

  const { t } = useTranslation()

  return (
    <SheetScreen>
      <KeyboardAvoidingView behavior="padding" style={flex.fill}>
        <Box flex={1} px="lg">
          <Box alignItems="center" flexDirection="row" mb="lg">
            <BackButton mr="md" />
            <Text color="textColor" variant="bodyLg">
              {t('Import Account')}
            </Text>
          </Box>
          {!importDone ? (
            <>
              <Text color="textColor" mb="xl" mt="sm" variant="body">
                {t(
                  'Watch or manage an account by inputting its ENS name, address, or secret phrase.'
                )}
              </Text>
              <ImportAccountForm onSuccess={onImportSuccess} />
            </>
          ) : (
            <>
              <Text color="textColor" mb="xl" mt="sm" variant="body">
                {t('Set a name for this account to help you stay organized.')}
              </Text>
              <NameAccountForm
                address={activeAccount?.address ?? NULL_ADDRESS}
                onSuccess={onNamingSuccess}
              />
            </>
          )}
        </Box>
      </KeyboardAvoidingView>
    </SheetScreen>
  )
}
