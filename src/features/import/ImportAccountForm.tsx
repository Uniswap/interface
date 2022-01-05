import { Formik, FormikErrors, useFormikContext } from 'formik'
import React, { useEffect } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { isValidEnsName } from 'src/features/ens/parseENSAddress'
import { useENSAddress } from 'src/features/ens/useENSAddress'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccountSaga'
import { ImportAccountInputType, ImportAccountType } from 'src/features/import/types'
import { isValidAddress } from 'src/utils/addresses'
import { getClipboard } from 'src/utils/clipboard'
import { isValidMnemonic } from 'src/utils/mnemonics'
import { isValidPrivateKey } from 'src/utils/privateKeys'
import { SagaStatus } from 'src/utils/saga'
import { normalizeTextInput } from 'src/utils/string'
import { useSagaStatus } from 'src/utils/useSagaStatus'

interface FormValues {
  input: string
  resolvedAddress: string | null
}

const initialValues: FormValues = {
  input: '',
  resolvedAddress: null,
}

interface Props {
  onSuccess: () => void
}

export function ImportAccountForm({ onSuccess }: Props) {
  const dispatch = useAppDispatch()
  const onSubmit = ({ input: rawInput, resolvedAddress }: FormValues) => {
    const input = normalizeTextInput(rawInput)
    const inputType = validateInput(input, resolvedAddress)
    if (inputType === ImportAccountInputType.Address) {
      dispatch(importAccountActions.trigger({ type: ImportAccountType.Address, address: input }))
    } else if (inputType === ImportAccountInputType.ENS && resolvedAddress) {
      dispatch(
        importAccountActions.trigger({ type: ImportAccountType.Address, address: resolvedAddress })
      )
    } else if (inputType === ImportAccountInputType.Mnemonic) {
      dispatch(importAccountActions.trigger({ type: ImportAccountType.Mnemonic, mnemonic: input }))
    } else if (inputType === ImportAccountInputType.PrivateKey) {
      dispatch(
        importAccountActions.trigger({ type: ImportAccountType.PrivateKey, privateKey: input })
      )
    }
  }

  const { status } = useSagaStatus(importAccountSagaName, onSuccess)
  const isLoading = status === SagaStatus.Started

  const { t } = useTranslation()
  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validateForm(t)}>
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        touched,
        errors,
        isValid,
        isSubmitting,
      }) => (
        <CenterBox>
          <Text variant="body" color="warning" textAlign="center" px="md">
            {t('Warning: this wallet is still experimental. Use with caution.')}
          </Text>
          <CenterBox
            px="md"
            pt="lg"
            mt="lg"
            backgroundColor="gray50"
            borderRadius="lg"
            width="100%">
            <TextInput
              autoCapitalize="none"
              onChangeText={handleChange('input')}
              onBlur={handleBlur('input')}
              value={values.input}
              placeholder={t('Secret Phrase, ENS name, or address')}
              multiline={true}
              numberOfLines={5}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              width="100%"
              height={140}
              textAlign="center"
              fontSize={18}
              backgroundColor="gray50"
              testID="import_account_form/input"
            />
            <PasteButton />
          </CenterBox>

          {touched.input && errors.input && (
            <Text variant="body" color="error" mt="md">
              {errors.input}
            </Text>
          )}

          {/* TODO show spinner in button while loading */}
          <PrimaryButton
            onPress={handleSubmit}
            label={t('Next')}
            disabled={!values.input || !isValid || isSubmitting || isLoading}
            mt="lg"
            width="100%"
            testID="import_account_form/submit"
          />

          <ENSResolver />
        </CenterBox>
      )}
    </Formik>
  )
}

function PasteButton() {
  const { setFieldValue } = useFormikContext<FormValues>()
  const onPress = async () => {
    const clipboard = await getClipboard()
    if (clipboard) {
      setFieldValue('input', clipboard)
    }
  }
  const { t } = useTranslation()
  return (
    <TextButton onPress={onPress} textColor="pink" textVariant="buttonLabel" p="md">
      {t('Paste')}
    </TextButton>
  )
}

// Helper component to resolve ENS addresses
function ENSResolver() {
  const { values, setFieldValue } = useFormikContext<FormValues>()
  const input = normalizeTextInput(values.input)
  const name = isValidEnsName(input) ? input : undefined
  const { address, loading } = useENSAddress(ChainId.MAINNET, name)

  useEffect(() => {
    if (!loading && address) {
      setFieldValue('resolvedAddress', address, true)
    } else {
      setFieldValue('resolvedAddress', null, true)
    }
  }, [address, loading, setFieldValue])

  return null
}

function validateForm(t: TFunction) {
  return (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {}
    const { input, resolvedAddress } = values
    if (!input) {
      errors.input = t('Value required')
    } else if (!validateInput(normalizeTextInput(input), resolvedAddress)) {
      errors.input = t('Invalid account info')
    }
    return errors
  }
}

function validateInput(input: string, resolvedAddress: string | null) {
  if (!input) return false
  if (isValidAddress(input)) return ImportAccountInputType.Address
  if (isValidEnsName(input) && resolvedAddress) return ImportAccountInputType.ENS
  if (isValidPrivateKey(input)) return ImportAccountInputType.PrivateKey
  if (isValidMnemonic(input)) return ImportAccountInputType.Mnemonic
  return false
}
