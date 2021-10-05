import { Formik, FormikErrors } from 'formik'
import React from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { MnemonicInput } from 'src/components/input/MnemonicInput'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccount'
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
  const onSubmit = (values: FormValues) => {
    dispatch(importAccountActions.trigger(values))
  }

  const { status } = useSagaStatus(importAccountSagaName, onImportSuccess)

  const { t } = useTranslation()
  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validateForm(t)}>
      {({ handleChange, handleBlur, handleSubmit, values, touched, errors }) => (
        <Box alignItems="center" justifyContent="center">
          <Text variant="body" mt="lg">
            {t('Enter your seed phrase (mnemonic):')}
          </Text>
          <MnemonicInput
            onChangeText={handleChange('mnemonic')}
            onBlur={handleBlur('mnemonic')}
            value={values.mnemonic}
            mt="lg"
          />
          {touched.mnemonic && errors.mnemonic && (
            <Text variant="bodySm" color="error">
              {errors.mnemonic}
            </Text>
          )}
          <PrimaryButton onPress={handleSubmit} label={t('Submit')} mt="lg" />
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
    } else if (!isValidMnemonic(values.mnemonic)) {
      errors.mnemonic = t('Invalid Mnemonic')
    }
    return errors
  }
}
