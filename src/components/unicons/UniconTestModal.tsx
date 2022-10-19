import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import {
  UniconAttributes,
  UniconAttributesToIndices,
  UniconNumOptions,
} from 'src/components/unicons/types'
import { EXPORT_FOR_TESTING, Unicon } from 'src/components/unicons/Unicon'
import { isEthAddress } from 'src/components/unicons/utils'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { ModalName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import {
  useAccounts,
  useActiveAccountAddressWithThrow,
  useDisplayName,
} from 'src/features/wallet/hooks'

const enum VisibleUnicons {
  EmblemContainerCombos,
  ColorCombos,
  Default,
  AndrewOnly,
}

function UniconShapeBlock({ shapeIndex }: { shapeIndex: number }) {
  return (
    <Flex row flex={1} flexWrap="wrap" gap="sm" p="sm">
      {Array.from(Array(UniconNumOptions[UniconAttributes.Container]).keys()).map((i) => (
        <Box key={`Shape${shapeIndex}-${i}`} height={36} width={36}>
          <EXPORT_FOR_TESTING.UniconSvg
            attributeIndices={
              {
                [UniconAttributes.GradientStart]: 2,
                [UniconAttributes.GradientEnd]: 0,
                [UniconAttributes.Container]: i,
                [UniconAttributes.Shape]: shapeIndex,
              } as UniconAttributesToIndices
            }
            size={36}
          />
        </Box>
      ))}
    </Flex>
  )
}

function UniconGradientStartBlock({ gradientStartIndex }: { gradientStartIndex: number }) {
  return (
    <Flex row flex={1} flexWrap="wrap" gap="sm" p="sm">
      {Array.from(Array(UniconNumOptions[UniconAttributes.GradientEnd]).keys()).map((i) => (
        <Box key={`GradientStart${gradientStartIndex}-${i}`} height={36} width={36}>
          <EXPORT_FOR_TESTING.UniconSvg
            attributeIndices={
              {
                [UniconAttributes.GradientStart]: gradientStartIndex,
                [UniconAttributes.GradientEnd]: i,
                [UniconAttributes.Container]: 0,
                [UniconAttributes.Shape]: 0,
              } as UniconAttributesToIndices
            }
            size={36}
          />
        </Box>
      ))}
    </Flex>
  )
}

function UniconOptions({ address, ensName }: { address: string; ensName?: string }) {
  const displayName = useDisplayName(address)
  return (
    <Flex centered gap="sm" p="sm">
      <Text variant="subhead">
        {ensName ? ensName : displayName?.name}: {address}
      </Text>
      <Flex row>
        <Flex>
          <Text variant="subhead">Option 1</Text>
          <Unicon address={address} randomSeed={0} size={50} />
        </Flex>
        <Flex>
          <Text variant="subhead">Option 2</Text>
          <Unicon address={address} randomSeed={545} size={50} />
        </Flex>
        <Flex>
          <Text variant="subhead">Option 3</Text>
          <Unicon address={address} randomSeed={424} size={50} />
        </Flex>
      </Flex>
    </Flex>
  )
}

function AddressSearchResult({ searchQuery }: { searchQuery: string }) {
  const { address: ensAddress, name: ensName } = useENS(ChainId.Mainnet, searchQuery, true)

  if (!ensAddress || !ensName) return null
  if (!isEthAddress(ensAddress)) {
    return <Text variant="subhead">Not a valid address</Text>
  }

  return <UniconOptions address={ensAddress} ensName={ensName} />
}

export function UniconTestModal({ onClose }: { onClose: () => void }) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()
  const addressToAccount = useAccounts()
  const addresses = Object.keys(addressToAccount)
  const [screenState, setScreenState] = useState<VisibleUnicons>(VisibleUnicons.Default)
  const [searchQuery, setSearchQuery] = useState<string>('')

  return (
    <BottomSheetModal
      fullScreen
      hideHandlebar
      backgroundColor={theme.colors.backgroundBackdrop}
      isVisible={true}
      name={ModalName.WalletConnectScan}
      onClose={onClose}>
      <ScrollView>
        <Flex gap="md">
          <PrimaryButton label="Close modal" onPress={onClose} />
          <Flex row gap="sm" justifyContent="space-between">
            <PrimaryButton
              flex={1}
              label="Emblem-Container Combos"
              onPress={() => setScreenState(VisibleUnicons.EmblemContainerCombos)}
            />
            <PrimaryButton
              flex={1}
              label="Color Combos"
              onPress={() => setScreenState(VisibleUnicons.ColorCombos)}
            />
            <PrimaryButton
              flex={1}
              label="Default"
              onPress={() => setScreenState(VisibleUnicons.Default)}
            />
          </Flex>
        </Flex>
        {screenState === VisibleUnicons.EmblemContainerCombos &&
          Array.from(Array(UniconNumOptions[UniconAttributes.Shape]).keys()).map((i) => (
            <Flex key={'EmblemContainerCombo' + i}>
              <Text variant="body">Shape {i + 1}</Text>
              <UniconShapeBlock shapeIndex={i} />
            </Flex>
          ))}
        {screenState === VisibleUnicons.ColorCombos &&
          Array.from(Array(UniconNumOptions[UniconAttributes.GradientStart]).keys()).map((i) => (
            <Flex key={'ColorCombo' + i}>
              <Text variant="body">GradientStart {i + 1}</Text>
              <UniconGradientStartBlock gradientStartIndex={i} />
            </Flex>
          ))}
        {screenState === VisibleUnicons.Default && (
          <>
            <SearchTextInput
              backgroundColor="backgroundBackdrop"
              placeholder={t('Input an address or ENS to view its Unicon')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => null}
            />
            {!!searchQuery && <AddressSearchResult searchQuery={searchQuery} />}
            {addresses.map((address) => (
              <UniconOptions key={address} address={address} />
            ))}
          </>
        )}
        {screenState === VisibleUnicons.AndrewOnly && (
          <Box>
            <Flex gap="sm" p="sm">
              <AddressDisplay
                showAddressAsSubtitle
                address="0x3Ec390c6372353703Dfece9755e4CC7Ab59A1372"
                size={36}
                variant="body"
                verticalGap="none"
              />
              <Flex row>
                <AccountCardItem
                  account={{ address: '0x3Ec390c6372353703Dfece9755e4CC7Ab59A1372' } as Account}
                  isActive={true}
                  isViewOnly={false}
                />
              </Flex>
            </Flex>
            <Flex flexDirection="row" gap="md" p="md">
              <Unicon address={activeAddress} size={36} />
              <Unicon address="0xb794f5ea0ba39494ce839613fffba74279579268" size={36} />
              <Unicon address="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" size={36} />
              <Unicon address="0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740" size={36} />
            </Flex>
            <Flex flexDirection="row" gap="md" p="md">
              <Unicon address="0x5C141b6786b90812628Ff778b22d328AA7A65549" size={36} />
              <Unicon address="0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8" size={36} />
              <Unicon address="0x4defA30195094963cFAc7285d8d6E6E523c7f90D" size={36} />
              <Unicon address="0x39336A270b92A64a68925fb8540E7b4AdF218e0a" size={36} />
            </Flex>
            <Flex flexDirection="row" gap="md" p="md">
              <Unicon address="0x82BdFf92B259d83382C28a2d0CF3229E0d8B0B98" size={36} />
              <Unicon address="0x514910771AF9Ca656af840dff83E8264EcF986CA" size={36} />
              <Unicon address="0xad6eaa735D9dF3D7696fd03984379dAE02eD8862" size={36} />
              <Unicon address="0x876eabf441b2ee5b5b0554fd502a8e0600950cfa" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x5807F31f1c1ED25B10700b8b5283f934E850Bc8b" size={36} />
              <Unicon address="0x6aE3bb8f4a629d1f65719BF415211e65D8a6b93e" size={36} />
              <Unicon address="0xDc05630a6175fdbA43771210914E691D3369C041" size={36} />
              <Unicon address="0xBaAcEAC0E85dB660Deb745256Db7709F2808Ae79" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x87ee4ec68CCBb6532B07841C46Afa048b565cb93" size={36} />
              <Unicon address="0x569Faf7685d1932794eb9d8b3456Bc6Fd5CABbCD" size={36} />
              <Unicon address="0x32313F79B54F423f356AAD5A8429984583925a46" size={36} />
              <Unicon address="0x609c1466953846Afd8afB7Cb431c9bC7b573Db6a" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x1Be2c39C2fE75B889b40ae69b15153c6d886A8Cf" size={36} />
              <Unicon address="0xbE43730d5F66cAb15Fa89BC9D0482B1141013bA7" size={36} />
              <Unicon address="0xE497Bf73320023277E46004A6237291f7cc8E51f" size={36} />
              <Unicon address="0x8D68A477D0c2Ae3db7977112CEBdE6b3CDAEBe5C" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x289e5ca7b65213B076DacA8d9250288AC51Ab6E8" size={36} />
              <Unicon address="0x2e5108862F694e30fAdF1dE9F77BEcBe6CFbd560" size={36} />
              <Unicon address="0x5140dA71f48eca4C176f489603EaF7b51590A25a" size={36} />
              <Unicon address="0x66088c33af416838FB1F1BaA95e1303949E3720c" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0xAceBabe64807cb045505b268ef253D8fC2FeF5Bc" size={36} />
              <Unicon address="0x44803B4C2b9d9c8c1117b5569a7a1E1b7168C483" size={36} />
              <Unicon address="0x00BDb5699745f5b860228c8f939ABF1b9Ae374eD" size={36} />
              <Unicon address="0x1522900B6daFac587d499a862861C0869Be6E428" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x95B4459FD89B225DcBBF2016D907Fb820b330eAa" size={36} />
              <Unicon address="0x03e836cFddCaF8683751925308ae985734955b33" size={36} />
              <Unicon address="0x00192Fb10dF37c9FB26829eb2CC623cd1BF599E8" size={36} />
              <Unicon address="0x810897aad1326Da8B5CA416E8aa0Ef2e4e2aaa9a" size={36} />
            </Flex>
            <Flex row gap="md" p="md">
              <Unicon address="0x941b4FdB4b1533Ab2Cc8b90fF0700F658B4Aa642" size={36} />
              <Unicon address="0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9" size={36} />
              <Unicon address="0x593b94c059f37f1AF542c25A0F4B22Cd2695Fb68" size={36} />
              <Unicon address="0xf6e11c9b062fea953b33c10D05162c90c5BCB065" size={36} />
            </Flex>
          </Box>
        )}
      </ScrollView>
    </BottomSheetModal>
  )
}
