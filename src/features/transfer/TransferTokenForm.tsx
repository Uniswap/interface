import { Formik } from 'formik'
import React, { useState } from 'react'
import { ActivityIndicator, Text } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AddressInput } from 'src/components/input/AddressInput'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout/Box'
import { Modal } from 'src/components/modals/Modal'
import { transferTokenActions } from 'src/features/transfer/transferTokenSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'

const initialValues = {
  tokenAddress: '',
  amount: '',
  toAddress: '',
}

type FormValues = typeof initialValues

export function TransferTokenForm() {
  const [showModal, setShowModal] = useState(false)
  const dispatch = useAppDispatch()

  const activeAccount = useActiveAccount()

  const onSubmit = (values: FormValues) => {
    if (!activeAccount) return
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(values))
    setShowModal(true)
    dispatch(transferTokenActions.trigger({ account: activeAccount, ...values }))
  }

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <Box alignItems="center" justifyContent="center">
            <Box alignItems="center" flexDirection="row" justifyContent="flex-end" mt="md">
              <Text>Address: </Text>
              <AddressInput
                value={values.toAddress}
                onBlur={handleBlur('toAddress')}
                onChangeText={handleChange('toAddress')}
              />
            </Box>
            <Box alignItems="center" flexDirection="row" justifyContent="flex-end" my="md">
              <Text>Amount: </Text>
              <AmountInput
                value={values.amount}
                onBlur={handleBlur('amount')}
                onChangeText={handleChange('amount')}
              />
            </Box>
            <PrimaryButton label="Send" onPress={handleSubmit} />
          </Box>
        )}
      </Formik>
      <Modal hide={() => setShowModal(false)} title="Importing" visible={showModal}>
        <ActivityIndicator />
      </Modal>
    </>
  )
}
