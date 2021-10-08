import { Formik } from 'formik'
import React, { useState } from 'react'
import { ActivityIndicator, Text } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AddressInput } from 'src/components/input/AddressInput'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout/Box'
import { Modal } from 'src/components/modals/Modal'
import { transferTokenActions } from 'src/features/transfer/transferToken'

const initialValues = {
  tokenId: '',
  amount: '',
  toAddress: '',
}

type FormValues = typeof initialValues

export function TransferTokenForm() {
  const [showModal, setShowModal] = useState(false)
  const dispatch = useAppDispatch()

  const onSubmit = (values: FormValues) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(values))
    setShowModal(true)
    dispatch(transferTokenActions.trigger(values))
  }

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <Box alignItems="center" justifyContent="center">
            <Box flexDirection="row" alignItems="center" justifyContent="flex-end" mt="md">
              <Text>Address: </Text>
              <AddressInput
                onChangeText={handleChange('toAddress')}
                onBlur={handleBlur('toAddress')}
                value={values.toAddress}
              />
            </Box>
            <Box flexDirection="row" alignItems="center" justifyContent="flex-end" my="md">
              <Text>Amount: </Text>
              <AmountInput
                onChangeText={handleChange('amount')}
                onBlur={handleBlur('amount')}
                value={values.amount}
              />
            </Box>
            <PrimaryButton onPress={handleSubmit} label="Send" />
          </Box>
        )}
      </Formik>
      <Modal title="Importing" hide={() => setShowModal(false)} visible={showModal}>
        <ActivityIndicator />
      </Modal>
    </>
  )
}
