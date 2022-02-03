import { Formik, FormikErrors, useFormikContext } from 'formik'
import React, { useCallback, useEffect } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
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
  const onSubmit = useCallback(
    ({ input: rawInput, resolvedAddress }: FormValues) => {
      const input = normalizeTextInput(rawInput)
      const inputType = validateInput(input, resolvedAddress)
      if (inputType === ImportAccountInputType.Address) {
        dispatch(importAccountActions.trigger({ type: ImportAccountType.Address, address: input }))
      } else if (inputType === ImportAccountInputType.ENS && resolvedAddress) {
        dispatch(
          importAccountActions.trigger({
            type: ImportAccountType.Address,
            address: resolvedAddress,
          })
        )
      } else if (inputType === ImportAccountInputType.Mnemonic) {
        dispatch(
          importAccountActions.trigger({ type: ImportAccountType.Mnemonic, mnemonic: input })
        )
      } else if (inputType === ImportAccountInputType.PrivateKey) {
        dispatch(
          importAccountActions.trigger({ type: ImportAccountType.PrivateKey, privateKey: input })
        )
      }
    },
    [dispatch]
  )

  const { t } = useTranslation()
  return (
    <Formik initialValues={initialValues} validate={validateForm(t)} onSubmit={onSubmit}>
      {({ handleChange, handleBlur, values, touched, errors }) => (
        <CenterBox>
          <Text color="warning" px="md" textAlign="center" variant="body">
            {t('Warning: this wallet is still experimental. Use with caution.')}
          </Text>
          <CenterBox
            backgroundColor="gray100"
            borderRadius="lg"
            mt="lg"
            pt="lg"
            px="md"
            width="100%">
            <TextInput
              autoCapitalize="none"
              backgroundColor="gray100"
              fontSize={18}
              height={140}
              multiline={true}
              numberOfLines={5}
              placeholder={t('Secret Phrase, ENS name, or address')}
              returnKeyType="done"
              testID="import_account_form/input"
              textAlign="center"
              value={values.input}
              width="100%"
              onBlur={handleBlur('input')}
              onChangeText={handleChange('input')}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <PasteButton />
          </CenterBox>

          {touched.input && errors.input && (
            <Text color="error" mt="md" variant="body">
              {errors.input}
            </Text>
          )}

          <SubmitButton onSuccess={onSuccess} />

          <ENSResolver />
        </CenterBox>
      )}
    </Formik>
  )
}

interface SubmitButtonProps {
  onSuccess: Props['onSuccess']
}

function SubmitButton({ onSuccess }: SubmitButtonProps) {
  const { status } = useSagaStatus(importAccountSagaName, onSuccess)
  const isLoading = status === SagaStatus.Started

  const { handleSubmit, values, isValid, isSubmitting } = useFormikContext<FormValues>()

  const { trigger, modal } = useBiometricPrompt(handleSubmit)

  const { t } = useTranslation()

  return (
    <>
      {/* TODO show spinner in button while loading */}
      <PrimaryButton
        disabled={!values.input || !isValid || isSubmitting || isLoading}
        label={t('Next')}
        mt="lg"
        testID="import_account_form/submit"
        width="100%"
        onPress={trigger}
      />
      {modal}
    </>
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
    <TextButton p="md" textColor="primary1" textVariant="buttonLabel" onPress={onPress}>
      {t('Paste')}
    </TextButton>
  )
}

// Helper component to resolve ENS addresses
function ENSResolver() {
  const { values, setFieldValue } = useFormikContext<FormValues>()
  const input = normalizeTextInput(values.input)
  const name = isValidEnsName(input) ? input : undefined
  const { address, loading } = useENSAddress(ChainId.Mainnet, name)

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
