import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import React, { useEffect, useState } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { Device } from 'react-native-ble-plx'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AccountStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { EmptyCircle } from 'src/components/icons/EmptyCircle'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { BluetoothLedgerSigner } from 'src/features/wallet/accounts/BluetoothLedgerSigner'
import { AccountType } from 'src/features/wallet/accounts/types'
import { ledgerActions, LedgerActionTypes } from 'src/features/wallet/ledgerSaga'
import { addAccount, addHardwareDevice, HardwareDeviceType } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { sleep } from 'src/utils/timing'

enum StepStatus {
  Done,
  InProgress,
  Loading,
  NotStarted,
}

function renderStepStatus(status: StepStatus) {
  switch (status) {
    case StepStatus.Done:
      return <CheckmarkCircle backgroundColor="deprecated_primary1" size={25} />
    case StepStatus.InProgress:
      return <EmptyCircle borderColor="deprecated_primary1" size={25} />
    case StepStatus.Loading:
      return <ActivityIndicator size={25} />
    case StepStatus.NotStarted:
      return <EmptyCircle borderColor="deprecated_gray600" size={25} />
  }
}

const textStyle = { flex: 1 }

function Step({ status, text }: { status: StepStatus; text: string }) {
  return (
    <Flex row alignContent="center">
      {renderStepStatus(status)}
      <Text
        color={
          status === StepStatus.Done
            ? 'deprecated_secondary1'
            : status === StepStatus.NotStarted
            ? 'deprecated_gray600'
            : 'deprecated_primary1'
        }
        style={textStyle}
        variant="subhead">
        {text}
      </Text>
    </Flex>
  )
}

enum CurrentStep {
  Error = -1,
  Start = 0,
  BluetoothOn = 1,
  Scanning = 2,
  DeviceFound = 3,
  Pairing = 4,
  Paired = 5,
  GettingAccount = 6,
  AccountFound = 7,
}

let unsubscribeBLE: undefined | (() => void)

function getPrimaryButtonText(currentStep: CurrentStep, t: TFunction<'translation'>) {
  switch (currentStep) {
    case CurrentStep.Start:
      return t('Turn on Bluetooth in Settings')
    case CurrentStep.BluetoothOn:
      return t('Scan for devices')
    case CurrentStep.Scanning:
      return t('Scanning')
    case CurrentStep.DeviceFound:
      return t('Pair with device')
    case CurrentStep.Pairing:
      return t('Pair with device')
    case CurrentStep.Paired:
      return t('Get account from ETH app')
    case CurrentStep.AccountFound:
      return t('Import account')
    case CurrentStep.Error:
      return t('Restart Scan')
    default:
      return t('Connect')
  }
}

function getPrimaryButtonDisabled(currentStep: CurrentStep) {
  return ![
    CurrentStep.Start,
    CurrentStep.BluetoothOn,
    CurrentStep.DeviceFound,
    CurrentStep.Paired,
    CurrentStep.AccountFound,
  ].includes(currentStep)
}

export function LedgerScreen({ navigation }: AccountStackScreenProp<Screens.ImportAccount>) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const bluetooth = useAppSelector((state) => state.wallet.bluetooth)
  const [device, setDevice] = useState<Device>()
  const [error, setError] = useState<Error>()
  const [currentStep, setCurrentStep] = useState<CurrentStep>(CurrentStep.Start)

  useEffect(() => {
    dispatch(ledgerActions.trigger({ type: LedgerActionTypes.OBSERVE }))
  }, [dispatch])

  useEffect(() => {
    if (bluetooth && currentStep === CurrentStep.Start) {
      setCurrentStep(CurrentStep.BluetoothOn)
    }
  }, [bluetooth, currentStep])

  useEffect(() => {
    return () => {
      if (unsubscribeBLE) {
        unsubscribeBLE()
      }
    }
  }, [])

  const scanForDevices = () => {
    const { unsubscribe } = TransportBLE.listen({
      next: (e: any) => {
        if (e.type === 'add') {
          const addedDevice = e.descriptor
          setDevice(addedDevice)
          setCurrentStep(CurrentStep.DeviceFound)
        }
      },
      error: (e: any) => {
        setError(e)
      },
    })
    unsubscribeBLE = unsubscribe
  }

  const pairDevice = async () => {
    try {
      await TransportBLE.open(device!.id)
      setCurrentStep(CurrentStep.Paired)
      dispatch(addHardwareDevice({ type: HardwareDeviceType.LEDGER, id: device!.id }))
    } catch (e: unknown) {
      setError(e as Error)
      setCurrentStep(CurrentStep.Error)
    }
  }

  const getAccount = async () => {
    for (let i = 0; i < 3; i++) {
      try {
        const bt = new BluetoothLedgerSigner(device!.id)
        const address = await bt.getAddress()
        dispatch(
          addAccount({
            type: AccountType.Ledger,
            deviceId: device!.id,
            name: device!.name!,
            address: address,
            path: bt.path,
          })
        )
        navigation.navigate(Screens.Accounts)
        break
      } catch (e) {
        await sleep(5000)
      }
    }

    setError(new Error(t('Unable to get device address')))
    setCurrentStep(CurrentStep.Error)
  }

  const primaryButtonText = getPrimaryButtonText(currentStep, t)

  const onPressPrimaryButton = () => {
    switch (currentStep) {
      case CurrentStep.Start:
        openUri('App-prefs:Bluetooth')
        break
      case CurrentStep.BluetoothOn:
        setCurrentStep(CurrentStep.Scanning)
        scanForDevices()
        break
      case CurrentStep.DeviceFound:
        setCurrentStep(CurrentStep.Pairing)
        pairDevice()
        break
      case CurrentStep.Paired:
        setCurrentStep(CurrentStep.GettingAccount)
        getAccount()
        break
    }
  }

  const onPressRestart = () => {
    setCurrentStep(CurrentStep.Start)
  }

  return (
    <SheetScreen>
      <Box flex={1} px="lg">
        <Box alignItems="center" flexDirection="row" mb="lg">
          <BackButton mr="md" />
          <Text color="black" variant="subhead">
            {t('Connect a Ledger Nano X')}
          </Text>
        </Box>
        <Flex>
          <Step
            key={CurrentStep.Start}
            status={
              currentStep >= CurrentStep.BluetoothOn ? StepStatus.Done : StepStatus.InProgress
            }
            text={
              currentStep === CurrentStep.Start
                ? t('Turn on Bluetooth in Settings')
                : t('Bluetooth is on')
            }
          />
          <Step
            key={CurrentStep.BluetoothOn}
            status={
              currentStep >= CurrentStep.Scanning
                ? StepStatus.Done
                : currentStep === CurrentStep.BluetoothOn
                ? StepStatus.InProgress
                : StepStatus.NotStarted
            }
            text={t(
              'Ledger is turned on, unlocked, not connected to other devices, and has no apps open'
            )}
          />
          <Step
            key={CurrentStep.Scanning}
            status={
              currentStep >= CurrentStep.DeviceFound
                ? StepStatus.Done
                : currentStep === CurrentStep.Scanning
                ? StepStatus.Loading
                : StepStatus.NotStarted
            }
            text={
              currentStep >= CurrentStep.DeviceFound
                ? t('Device found: ') + device?.name
                : currentStep === CurrentStep.Scanning
                ? t('Scanning for devices')
                : t('Scan for devices')
            }
          />
          <Step
            key={CurrentStep.DeviceFound}
            status={
              currentStep >= CurrentStep.Paired
                ? StepStatus.Done
                : currentStep === CurrentStep.Pairing
                ? StepStatus.Loading
                : currentStep === CurrentStep.DeviceFound
                ? StepStatus.InProgress
                : StepStatus.NotStarted
            }
            text={
              currentStep >= CurrentStep.Paired
                ? t('Paired with device: ') + device?.name
                : currentStep === CurrentStep.Pairing
                ? t('Pairing with device: ') + device?.name
                : currentStep === CurrentStep.DeviceFound
                ? t('Pair with device: ') + device?.name
                : t('Pair with device')
            }
          />
          <Step
            key={CurrentStep.Paired}
            status={
              currentStep >= CurrentStep.AccountFound
                ? StepStatus.Done
                : currentStep === CurrentStep.GettingAccount
                ? StepStatus.Loading
                : StepStatus.NotStarted
            }
            text={
              currentStep >= CurrentStep.AccountFound
                ? t('Imported account')
                : currentStep === CurrentStep.GettingAccount
                ? t('Getting account address')
                : t('Open Ethereum app to import account')
            }
          />
          <PrimaryButton
            disabled={getPrimaryButtonDisabled(currentStep)}
            label={primaryButtonText}
            mt="xl"
            name={primaryButtonText}
            onPress={onPressPrimaryButton}
          />
          <TextButton
            alignSelf="center"
            mt="md"
            name={ElementName.Restart}
            textColor="deprecated_primary1"
            textVariant="body"
            onPress={onPressRestart}>
            {t('Restart Pairing')}
          </TextButton>
          {error && (
            <Text color="deprecated_red" variant="body">
              {error}
            </Text>
          )}
        </Flex>
      </Box>
    </SheetScreen>
  )
}
