import { graphql } from 'babel-plugin-relay/macro'
import { selectionAsync } from 'expo-haptics'
import React, { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import ScanQRIcon from 'src/assets/icons/scan-qr.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loading } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import TransactionList from 'src/components/TransactionList/TransactionList'
import SessionsButton from 'src/components/WalletConnect/SessionsButton'
import { openModal } from 'src/features/modals/modalSlice'
import { clearNotificationCount } from 'src/features/notifications/notificationSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { parseDataResponseToTransactionDetails } from 'src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Screens } from 'src/screens/Screens'
import {
  ActivityScreenQuery,
  ActivityScreenQuery$data,
} from 'src/screens/__generated__/ActivityScreenQuery.graphql'

const MAX_SCROLL_HEIGHT = 180

export const activityScreenQuery = graphql`
  query ActivityScreenQuery($address: String!) {
    assetActivities(address: $address, pageSize: 50, page: 1) {
      timestamp
      type
      transaction {
        hash
        status
        to
        from
      }
      assetChanges {
        __typename
        ... on TokenTransfer {
          asset {
            name
            symbol
            address
            decimals
            chain
          }
          tokenStandard
          quantity
          sender
          recipient
          direction
          transactedValue {
            currency
            value
          }
        }
        ... on NftTransfer {
          asset {
            name
            nftContract {
              chain
              address
            }
            tokenId
            imageUrl
            collection {
              name
            }
          }
          nftStandard
          sender
          recipient
          direction
        }
        ... on TokenApproval {
          asset {
            name
            symbol
            decimals
            address
            chain
          }
          tokenStandard
          approvedAddress
          quantity
        }
      }
    }
  }
`

export type ActivityScreenQueryResponse = NonNullable<
  ActivityScreenQuery$data['assetActivities']
>[0]

export function ActivityScreen({ route }: AppStackScreenProp<Screens.Activity>) {
  const { preloadedQuery } = route.params

  if (!preloadedQuery) {
    // TODO: improve loading state
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <Activity preloadedQuery={preloadedQuery} />
    </Suspense>
  )
}

export function Activity({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<ActivityScreenQuery>
}) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()
  const { t } = useTranslation()
  const { address, type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  // Parse remote txn data from query and merge with local txn data
  const transactionData = usePreloadedQuery<ActivityScreenQuery>(
    activityScreenQuery,
    preloadedQuery
  )

  const formattedTransactions = useMemo(
    () => (transactionData ? parseDataResponseToTransactionDetails(transactionData) : []),
    [transactionData]
  )
  const allTransactions = useMergeLocalAndRemoteTransactions(address, formattedTransactions)

  const { sessions } = useWalletConnect(address)

  const onPressScan = useCallback(() => {
    selectionAsync()
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: ScannerModalState.WalletQr,
      })
    )
  }, [dispatch])

  const onPressSessions = useCallback(() => {
    if (address) {
      navigation.navigate(Screens.SettingsWalletManageConnection, { address })
    }
  }, [address, navigation])

  useEffect(() => {
    dispatch(clearNotificationCount({ address }))
  }, [dispatch, address])

  const ContentHeader = useMemo(
    () => (
      <Flex row alignItems="center" justifyContent="space-between" p="md">
        <BackButton size={theme.iconSizes.lg} />
        <Text variant="mediumLabel">{t('Activity')}</Text>
        <Button name={ElementName.WalletConnectScan} onPress={onPressScan}>
          <ScanQRIcon color={theme.colors.textSecondary} height={24} width={24} />
        </Button>
      </Flex>
    ),
    [onPressScan, t, theme.colors.textSecondary, theme.iconSizes.lg]
  )

  return (
    <HeaderScrollScreen
      contentHeader={ContentHeader}
      fixedHeader={
        <Flex centered>
          <AddressDisplay address={address} variant="subhead" />
        </Flex>
      }
      maxScrollHeightOverride={MAX_SCROLL_HEIGHT}>
      {sessions.length > 0 && (
        <Flex px="sm">
          <SessionsButton sessions={sessions} onPress={onPressSessions} />
        </Flex>
      )}
      <Flex pb="lg" px="sm">
        <TransactionList
          emptyStateContent={
            <Flex centered gap="xxl" mt="xl" mx="xl">
              <Flex centered gap="xs">
                <Text variant="subhead">{t('No activity yet')}</Text>
                <Text color="textSecondary" variant="bodySmall">
                  {t(
                    'When you make transactions or interact with sites, details of your activity will appear here.'
                  )}
                </Text>
              </Flex>
              <Flex row>
                {/* TODO: Add a buy button when fiat OR is implemented */}
                <PrimaryButton
                  borderRadius="md"
                  icon={<ScanQRIcon color={theme.colors.textPrimary} height={20} width={20} />}
                  label={t('Receive')}
                  variant="transparent"
                  onPress={onPressScan}
                />
              </Flex>
            </Flex>
          }
          readonly={readonly}
          transactions={allTransactions}
        />
      </Flex>
    </HeaderScrollScreen>
  )
}
