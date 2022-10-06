import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { ExploreStackParamList } from 'src/app/navigation/types'
import EyeOffIcon from 'src/assets/icons/eye-off.svg'
import EyeIcon from 'src/assets/icons/eye.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { BlueToDarkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PortfolioNFTsSection } from 'src/components/home/PortfolioNFTsSection'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Loading } from 'src/components/loading'
import { TransactionListSection } from 'src/components/TransactionList/TransactionListSection'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { addWatchedAddress, removeWatchedAddress } from 'src/features/favorites/slice'
import { parseDataResponseToTransactionDetails } from 'src/features/transactions/history/utils'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import {
  UserScreenQuery,
  UserScreenQuery$data,
} from 'src/screens/__generated__/UserScreenQuery.graphql'

type Props = NativeStackScreenProps<ExploreStackParamList, Screens.User>

export const userScreenQuery = graphql`
  query UserScreenQuery($address: String!) {
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

export type UserScreenQueryResponse = NonNullable<UserScreenQuery$data['assetActivities']>[0]

export function UserScreen({
  route: {
    params: { address, preloadedQuery },
  },
}: Props) {
  if (!preloadedQuery) {
    return <Loading />
  }

  return (
    <Suspense fallback={<Loading />}>
      <UserScreenInner address={address} preloadedQuery={preloadedQuery} />
    </Suspense>
  )
}

function UserScreenInner({
  address,
  preloadedQuery,
}: {
  address: string
  preloadedQuery: PreloadedQuery<UserScreenQuery>
}) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const transactionData = usePreloadedQuery<UserScreenQuery>(userScreenQuery, preloadedQuery)
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

  return (
    <HeaderScrollScreen
      background={
        <GradientBackground opacity={1}>
          <BlueToDarkRadial />
        </GradientBackground>
      }
      contentHeader={
        <Flex gap="md" mx="md" pt="md">
          <BackButton showButtonLabel />
          <AddressDisplay
            address={address}
            captionVariant="mediumLabel"
            direction="column"
            showAddressAsSubtitle={true}
            showCopy={true}
            size={48}
            variant="headlineMedium"
          />
        </Flex>
      }
      fixedHeader={
        <BackHeader>
          <AddressDisplay address={address} captionVariant="subhead" size={16} />
        </BackHeader>
      }>
      <VirtualizedList>
        <Flex gap="lg" mb="md" px="md">
          {/* profile info */}
          <Flex centered row flex={1} gap="xs" mt="md" px="xl">
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
          <TransactionListSection transactions={formattedTransactions} />
          <PortfolioNFTsSection count={4} owner={address} />
          <PortfolioTokensSection count={3} owner={address} />
        </Flex>
      </VirtualizedList>
    </HeaderScrollScreen>
  )
}
