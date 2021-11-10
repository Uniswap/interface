import { Formik, FormikErrors, useFormikContext } from 'formik'
import React, { useState } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AddressInput } from 'src/components/input/AddressInput'
import { TextInput } from 'src/components/input/TextInput'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { QuoteProvider } from 'src/features/swap/QuoterProvider'
import { swapActions } from 'src/features/swap/SwapSaga'
import { QuoteParams, QuoteResult } from 'src/features/swap/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { isValidAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

export function SwapForm() {
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()

  const [quoteResult, setQuoteResult] = useState<QuoteResult>()

  const { t } = useTranslation()

  const onSubmit = () => {
    if (!activeAccount || !quoteResult?.methodParameters) {
      logger.error('SwapForm', 'onSubmit', '`activeAccount` and `quoteResult` must be defined.')
      return
    }

    dispatch(
      swapActions.trigger({
        account: activeAccount,
        methodParameters: quoteResult.methodParameters,
      })
    )
  }

  return (
    <Formik initialValues={{}} onSubmit={onSubmit} validate={validate(t)}>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
        <Box alignItems="center" justifyContent="center" p="lg" pt="xs">
          <Text variant="h2" mb="sm">
            Swap on Rinkeby
          </Text>

          <BaseCurrencies />

          <Box alignItems="center" mt="sm">
            <Text variant="buttonLabel">Input Amount</Text>
            <TextInput
              onChangeText={handleChange('amountIn')}
              onBlur={handleBlur('amountIn')}
              placeholder={t`Amount In`}
              value={values.amountIn}
              keyboardType="numeric"
            />
            {touched.amountIn && errors.amountIn && (
              <Text variant="bodySm" color="error">
                {errors.amountIn}
              </Text>
            )}
          </Box>

          <Box alignItems="center" mt="lg">
            <Text variant="buttonLabel">Input Address</Text>

            <AddressInput
              onChangeText={handleChange('inAddress')}
              onBlur={handleBlur('inAddress')}
              value={values.inAddress}
              placeholder={t`In address`}
            />
            {touched.inAddress && errors.inAddress && (
              <Text variant="bodySm" color="error">
                {errors.inAddress}
              </Text>
            )}
          </Box>

          <Box alignItems="center" mt="lg">
            <Text variant="buttonLabel">Output Address</Text>
            <AddressInput
              onChangeText={handleChange('outAddress')}
              onBlur={handleBlur('outAddress')}
              value={values.outAddress}
              placeholder={t`Out address`}
            />
            {touched.outAddress && errors.outAddress && (
              <Text variant="bodySm" color="error">
                {errors.outAddress}
              </Text>
            )}
          </Box>

          <PrimaryButton mt="lg" onPress={handleSubmit} label={t`Swap`} />

          <Box mt="lg" mb="sm" alignItems="center">
            <Text variant="buttonLabel">Quote output amount (raw)</Text>
            <TextInput
              keyboardType="numeric"
              onBlur={handleBlur('amountOut')}
              onChangeText={handleChange('amountOut')}
              placeholder={t`Amount out`}
              value={values.amountOut}
            />
            {touched.amountOut && errors.amountOut && (
              <Text variant="bodySm" color="error">
                {errors.amountOut}
              </Text>
            )}
          </Box>

          <Box mt="lg">
            <QuoteProvider
              params={values}
              setQuoteResult={(_quoteResult: QuoteResult) => {
                setFieldValue('amountOut', _quoteResult.quote)
                setQuoteResult(_quoteResult)
              }}
            />
          </Box>
        </Box>
      )}
    </Formik>
  )
}

// Utility component to provide devs with preset token addresses
// Will be removed once the token selector is built
function BaseCurrencies() {
  const { setFieldValue } = useFormikContext<QuoteParams>()

  return (
    <Box flexDirection="row" alignItems="center" justifyContent="center" p="sm">
      <PrimaryButton
        label="Rinkeby ETH (in)"
        onPress={() => setFieldValue('inAddress', '0xc778417E063141139Fce010982780140Aa0cD5Ab')}
        mr="md"
      />
      <PrimaryButton
        label="Rinkeby UNI (out)"
        onPress={() => setFieldValue('outAddress', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')}
      />
    </Box>
  )
}

function validate(t: TFunction) {
  return (values: QuoteParams) => {
    let errors: FormikErrors<QuoteParams> = {}
    if (!values.amountIn) {
      errors.amountIn = t`Required`
    } else if (!values.inAddress) {
      errors.inAddress = t`Required`
    } else if (!values.outAddress) {
      errors.outAddress = t`Required`
    } else if (isNaN(parseFloat(values.amountIn))) {
      errors.amountIn = t`Invalid amount`
    } else if (!isValidAddress(values.inAddress)) {
      errors.inAddress = t`Invalid address in`
    } else if (!isValidAddress(values.outAddress)) {
      errors.outAddress = t`Invalid address out`
    }
    return errors
  }
}
