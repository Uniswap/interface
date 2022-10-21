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
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { useAddressFromEns } from 'src/features/ens/api'
import { isValidEnsName } from 'src/features/ens/parseENSAddress'
import { importAccountActions, importAccountSagaName } from 'src/features/import/importAccountSaga'
import { ImportAccountInputType, ImportAccountType } from 'src/features/import/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { getValidAddress } from 'src/utils/addresses'
import { getClipboard } from 'src/utils/clipboard'
import { isValidMnemonic } from 'src/utils/mnemonics'
import { SagaStatus } from 'src/utils/saga'
import { normalizeTextInput } from 'src/utils/string'
import { useSagaStatus } from 'src/utils/useSagaStatus'
import { ElementName, SectionName } from '../telemetry/constants'
import { Trace } from '../telemetry/Trace'

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
  const { t } = useTranslation()

  const onSubmit = useCallback(
    ({ input: rawInput, resolvedAddress }: FormValues) => {
      const input = normalizeTextInput(rawInput)
      const inputType = validateInput(input, resolvedAddress, t)
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
      }
      // Activate all new accounts.
      dispatch(pendingAccountActions.trigger(PendingAccountActions.ACTIVATE))
    },
    [dispatch, t]
  )

  return (
    <Formik initialValues={initialValues} validate={validateForm(t)} onSubmit={onSubmit}>
      {({ handleChange, handleBlur, values, touched, errors }) => (
        <Trace section={SectionName.ImportAccountForm}>
          <CenterBox>
            <Text color="accentWarning" px="md" textAlign="center" variant="bodyLarge">
              {t('Warning: this wallet is still experimental. Use with caution.')}
            </Text>
            <CenterBox
              backgroundColor="background1"
              borderRadius="lg"
              mt="lg"
              pt="lg"
              px="md"
              width="100%">
              <TextInput
                autoCapitalize="none"
                backgroundColor="background1"
                fontSize={18}
                height={100}
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
              <Text color="accentCritical" mt="md" variant="bodyLarge">
                {errors.input}
              </Text>
            )}

            <SubmitButton onSuccess={onSuccess} />

            <ENSResolver />
          </CenterBox>
        </Trace>
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

  const { trigger } = useBiometricPrompt(handleSubmit)

  const { t } = useTranslation()

  return (
    <>
      {/* TODO show spinner in button while loading */}
      <PrimaryButton
        disabled={!values.input || !isValid || isSubmitting || isLoading}
        label={t('Continue')}
        mt="lg"
        name={ElementName.Submit}
        testID={ElementName.Submit}
        width="100%"
        onPress={trigger}
      />
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
    <TextButton p="md" textColor="accentAction" textVariant="buttonLabelMedium" onPress={onPress}>
      {t('Paste')}
    </TextButton>
  )
}

// Helper component to resolve ENS addresses
function ENSResolver() {
  const { values, setFieldValue } = useFormikContext<FormValues>()
  const input = normalizeTextInput(values.input)
  const name = isValidEnsName(input) ? input : null
  const { data: address, isLoading } = useAddressFromEns(name)

  useEffect(() => {
    if (!isLoading && address) {
      setFieldValue('resolvedAddress', address, true)
    } else {
      setFieldValue('resolvedAddress', null, true)
    }
  }, [address, isLoading, setFieldValue])

  return null
}

function validateForm(t: TFunction) {
  return (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {}
    const { input, resolvedAddress } = values
    if (!input) {
      errors.input = t('Value required')
    } else if (!validateInput(normalizeTextInput(input), resolvedAddress, t)) {
      errors.input = t('Invalid account info')
    }
    return errors
  }
}

function validateInput(input: string, resolvedAddress: string | null, t: TFunction) {
  if (!input) return false
  if (getValidAddress(input, true, false)) return ImportAccountInputType.Address
  if (isValidEnsName(input) && resolvedAddress) return ImportAccountInputType.ENS
  if (isValidMnemonic(input, t)) return ImportAccountInputType.Mnemonic
  return false
}
