import { Formik, FormikErrors, useFormikContext } from 'formik'
import React, { useEffect } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccountSaga'
import { logger } from 'src/utils/logger'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const initialValues = {
  addressOrENS: '',

  // hidden field. filled by ENS resovler hook to share in form context
  resolvedAddress: null,
}

type FormValues = typeof initialValues

interface Props {
  onImportSuccess: () => void
}

// TODO: very rough draft to handle readonly accounts
export function ImportReadonlyAccountForm({ onImportSuccess }: Props) {
  const dispatch = useAppDispatch()

  const { status } = useSagaStatus(importAccountSagaName, onImportSuccess)

  const { t } = useTranslation()

  const onSubmit = ({ resolvedAddress }: FormValues) => {
    if (!resolvedAddress) {
      logger.error('importReadonlyAccountForm', 'onSubmit', 'Expected address to be defined')
      return
    }
    dispatch(importAccountActions.trigger({ address: resolvedAddress }))
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validateForm(t)}>
      {({ handleChange, handleBlur, handleSubmit, values, touched, errors, isSubmitting }) => {
        return (
          <Box alignItems="center" justifyContent="center">
            <Text variant="body" mt="lg">
              {t`Add a wallet by typing or pasting an ENS name, Ethereum Account or Polygon Account.`}
            </Text>

            <TextInput
              onChangeText={handleChange('addressOrENS')}
              onBlur={handleBlur('addressOrENS')}
              value={values.addressOrENS}
              mt="lg"
              placeholder="ENS name or address Address"
              testID="import_account_form/address/field"
            />
            {touched.addressOrENS && errors.addressOrENS && (
              <Text variant="bodySm" color="error">
                {errors.addressOrENS}
              </Text>
            )}

            <PrimaryButton
              onPress={handleSubmit}
              label={t('Track')}
              mt="lg"
              disabled={!values.resolvedAddress || isSubmitting}
            />
            {status === SagaStatus.Started && <ActivityIndicator />}

            <ENSResolver />
          </Box>
        )
      }}
    </Formik>
  )
}

// Helper component to resolve ENS addresses
function ENSResolver() {
  const { values, setFieldValue } = useFormikContext<FormValues>()

  // TODO: consider using FormikContext.status
  const { address, loading } = useENS(ChainId.MAINNET, values.addressOrENS)

  useEffect(() => {
    if (!loading && address) {
      setFieldValue('resolvedAddress', address)
    }
  }, [address, loading, setFieldValue])

  return null
}

function validateForm(t: TFunction) {
  return (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {}
    if (!values.addressOrENS) {
      errors.addressOrENS = t('Required')
    }
    return errors
  }
}
