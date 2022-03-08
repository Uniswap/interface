import { utils } from 'ethers'
import { Formik } from 'formik'
import React from 'react'
import { ActivityIndicator, Text } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AddressInput } from 'src/components/input/AddressInput'
import { AmountInput } from 'src/components/input/AmountInput'
import { Box } from 'src/components/layout/Box'
import { Modal } from 'src/components/modals/Modal'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import {
  transferTokenActions,
  transferTokenSagaName,
} from 'src/features/transfer/transferTokenSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { parseAddress } from 'src/utils/addresses'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const initialValues = {
  tokenAddress: '',
  amount: '',
  toAddress: '',
}

type FormValues = typeof initialValues

// TODO the transferSaga is working and supports both native / token transfers
// but this UI still needs to be redone. Still just a PoC for native Eth transfers on Rinkeby
export function TransferTokenForm() {
  const navigation = useAppStackNavigation()
  const dispatch = useAppDispatch()
  const activeAccount = useActiveAccount()

  const onSubmit = (values: FormValues) => {
    if (!activeAccount) return
    // See ImportAccountForm for an example of how to validate properly
    // and useDerivedSwapInfo for how to handle currencies
    const toAddress = parseAddress(values.toAddress)
    const amountInWei = utils.parseEther(values.amount).toString()
    if (!toAddress || !amountInWei) return
    dispatch(
      transferTokenActions.trigger({
        account: activeAccount,
        toAddress,
        amountInWei,
        tokenAddress: NULL_ADDRESS,
        chainId: ChainId.Rinkeby,
      })
    )
  }

  const { status } = useSagaStatus(transferTokenSagaName, () => navigation.goBack())

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
            <PrimaryButton label="Send" name={ElementName.Submit} onPress={handleSubmit} />
          </Box>
        )}
      </Formik>
      <Modal title="Sending" visible={status === SagaStatus.Started}>
        <ActivityIndicator />
      </Modal>
    </>
  )
}
