import { Formik, FormikErrors } from 'formik'
import React from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { MnemonicInput } from 'src/components/input/MnemonicInput'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccountSaga'
import { isValidMnemonic } from 'src/utils/mnemonics'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const initialValues = {
  mnemonic: '',
}

type FormValues = typeof initialValues

interface Props {
  onImportSuccess: () => void
}

export function ImportAccountForm(props: Props) {
  const { onImportSuccess } = props
  const dispatch = useAppDispatch()
  const onSubmit = ({ mnemonic }: FormValues) => {
    if (isValidMnemonic(mnemonic)) {
      dispatch(importAccountActions.trigger({ mnemonic }))
    } else {
      // TODO: rename `mnemonic` to `mnemonicOrPrivateKey`/`secret`
      dispatch(importAccountActions.trigger({ privateKey: mnemonic }))
    }
  }

  const { status } = useSagaStatus(importAccountSagaName, onImportSuccess)

  const { t } = useTranslation()
  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validateForm(t)}>
      {({ handleChange, handleBlur, handleSubmit, values, touched, errors }) => (
        <Box alignItems="center" justifyContent="center">
          <Text variant="body">{t('Enter your seed phrase (mnemonic):')}</Text>
          <PrimaryButton
            onPress={handleSubmit}
            label={t('Submit')}
            mt="lg"
            testID="import_account_form/mnemonic/submit"
          />
          <MnemonicInput
            onChangeText={handleChange('mnemonic')}
            onBlur={handleBlur('mnemonic')}
            value={values.mnemonic}
            testID="import_account_form/mnemonic/field"
          />
          {touched.mnemonic && errors.mnemonic && (
            <Text variant="bodySm" color="error">
              {errors.mnemonic}
            </Text>
          )}

          {status === SagaStatus.Started && <ActivityIndicator />}
        </Box>
      )}
    </Formik>
  )
}

function validateForm(t: TFunction) {
  return (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {}
    if (!values.mnemonic) {
      errors.mnemonic = t('Required')
    }
    // TODO: add validation for mnemonic or private key
    // else if (!isValidMnemonic(values.mnemonic)) {
    //   errors.mnemonic = t('Invalid Mnemonic')
    // }
    return errors
  }
}
