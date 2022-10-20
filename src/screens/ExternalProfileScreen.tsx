import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'
import { Route } from 'react-native-tab-view'
import { PreloadedQuery } from 'react-relay'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { useEagerLoadedQuery } from 'src/app/navigation/useEagerNavigation'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { NftsTab } from 'src/components/home/NftsTab'
import { TokensTab } from 'src/components/home/TokensTab'
import { Flex } from 'src/components/layout'
import TabbedScrollScreen, {
  TabViewScrollProps,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import ProfileActivityTab from 'src/components/profile/tabs/ProfileActivityTab'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { parseDataResponseToTransactionDetails } from 'src/features/transactions/history/utils'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import {
  ExternalProfileScreenQuery,
  ExternalProfileScreenQuery$data,
} from 'src/screens/__generated__/ExternalProfileScreenQuery.graphql'

type Props = NativeStackScreenProps<ExploreStackParamList, Screens.ExternalProfile>

export const externalProfileScreenQuery = graphql`
  query ExternalProfileScreenQuery($address: String!) {
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

export type ExternalProfileScreenQueryResponse = NonNullable<
  ExternalProfileScreenQuery$data['assetActivities']
>[0]

const TOKENS_KEY = 'profile-tokens'
const NFTS_KEY = 'profile-nfts'
const ACTIVITY_KEY = 'profile-activity'

export function ExternalProfileScreen({
  route: {
    params: { address, preloadedQuery },
  },
}: Props) {
  if (!preloadedQuery) {
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <ExternalProfileScreenInner address={address} preloadedQuery={preloadedQuery} />
    </Suspense>
  )
}

function ExternalProfileScreenInner({
  address,
  preloadedQuery,
}: {
  address: string
  preloadedQuery: PreloadedQuery<ExternalProfileScreenQuery>
}) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const transactionData = useEagerLoadedQuery<ExternalProfileScreenQuery>(
    externalProfileScreenQuery,
    preloadedQuery
  )
  const formattedTransactions = useMemo(
    () => (transactionData ? parseDataResponseToTransactionDetails(transactionData) : []),
    [transactionData]
  )

  const isWatching = useAppSelector(selectWatchedAddressSet).has(address)

  const onWatchPress = () => {
    if (isWatching) {
      dispatch(removeWatchedAddress({ address }))
    } else {
      dispatch(addWatchedAddress({ address }))
    }
  }

  const initialSendState = useMemo(() => {
    return {
      recipient: address,
      exactAmountToken: '',
      exactAmountUSD: '',
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    }
  }, [address])

  const tabs = useMemo(
    () => [
      { key: ACTIVITY_KEY, title: t('Activity') },
      { key: NFTS_KEY, title: t('NFTs') },
      { key: TOKENS_KEY, title: t('Tokens') },
    ],
    [t]
  )

  const renderTab = useCallback(
    (route: Route, scrollProps: TabViewScrollProps, loadingContainerStyle: ViewStyle) => {
      switch (route?.key) {
        case ACTIVITY_KEY:
          return (
            <ProfileActivityTab
              tabViewScrollProps={scrollProps}
              transactions={formattedTransactions}
            />
          )
        case NFTS_KEY:
          return (
            <NftsTab
              loadingContainerStyle={loadingContainerStyle}
              owner={address}
              tabViewScrollProps={scrollProps}
            />
          )
        case TOKENS_KEY:
          return (
            <TokensTab
              loadingContainerStyle={loadingContainerStyle}
              owner={address}
              tabViewScrollProps={scrollProps}
            />
          )
      }
      return null
    },
    [address, formattedTransactions]
  )

  return (
    <TabbedScrollScreen
      contentHeader={
        <Flex gap="sm" mb="sm" mx="md">
          <BackButton showButtonLabel />
          <AddressDisplay
            address={address}
            captionVariant="subheadLarge"
            direction="column"
            showAddressAsSubtitle={true}
            showCopy={true}
            size={48}
            variant="headlineMedium"
          />
          <Flex centered row gap="xs" my="md" px="xl">
            <SendButton
              borderRadius="lg"
              flexBasis="49%"
              iconStrokeWidth={3}
              initialState={initialSendState}
              px="lg"
            />
            <PrimaryButton
              borderRadius="lg"
              flexBasis="49%"
              icon={
                isWatching ? (
                  <EyeOffIcon color={theme.colors.textPrimary} height={20} width={20} />
                ) : (
                  <EyeIcon
                    color={theme.colors.textPrimary}
                    height={20}
                    strokeWidth={1.5}
                    width={20}
                  />
                )
              }
              label={isWatching ? t('Unwatch') : t('Watch')}
              px="lg"
              variant="transparent"
              onPress={onWatchPress}
            />
          </Flex>
        </Flex>
      }
      renderTab={renderTab}
      tabs={tabs}
    />
  )
}
