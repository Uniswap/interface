import React, { ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, ViewStyle } from 'react-native'
import 'react-native-reanimated'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Text } from 'src/components/Text'
import { DappConnectionItem } from 'src/components/WalletConnect/ConnectedDapps/DappConnectionItem'
import { DappSwitchNetworkModal } from 'src/components/WalletConnect/ConnectedDapps/DappSwitchNetworkModal'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { dimensions } from 'src/styles/sizing'

type ConnectedDappsProps = {
  sessions: WalletConnectSession[]
  backButton?: ReactElement
}

export function ConnectedDappsList({ backButton, sessions }: ConnectedDappsProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const [selectedSession, setSelectedSession] = useState<WalletConnectSession>()

  const headerText = (
    <Text color="textPrimary" variant="bodyLarge">
      {t('Manage connections')}
    </Text>
  )
  const header = backButton ? (
    <Flex row alignItems="center" justifyContent="space-between" pb="xs">
      {backButton}
      {headerText}
      <Box width={theme.iconSizes.lg} />
    </Flex>
  ) : (
    <BackHeader alignment="center">{headerText}</BackHeader>
  )

  return (
    <>
      <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} pt="lg" px="lg">
        {header}

        {sessions.length > 0 ? (
          <FlatList
            columnWrapperStyle={ColumnStyle.base}
            data={sessions}
            keyExtractor={(item): string => item.id}
            numColumns={2}
            renderItem={(item): JSX.Element => (
              <DappConnectionItem
                wrapped={item}
                onPressChangeNetwork={(): void => {
                  setSelectedSession(item.item)
                }}
              />
            )}
          />
        ) : (
          <Flex fill alignItems="center" gap="xs" style={emptyCardStyle}>
            <Text color="textPrimary" variant="subheadLarge">
              {t('No apps connected')}
            </Text>
            <Text color="textSecondary" textAlign="center" variant="bodySmall">
              {t('Connect to an app by scanning a code via WalletConnect')}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      {selectedSession && (
        <DappSwitchNetworkModal
          selectedSession={selectedSession}
          onClose={(): void => setSelectedSession(undefined)}
        />
      )}
    </>
  )
}

const ColumnStyle = StyleSheet.create({
  base: {
    justifyContent: 'space-between',
  },
})
const emptyCardStyle: ViewStyle = {
  paddingTop: dimensions.fullHeight / 5,
}
