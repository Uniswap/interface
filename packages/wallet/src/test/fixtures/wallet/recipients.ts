import { SectionListData } from 'react-native'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { faker } from 'wallet/src/test/shared'
import { createFixture } from 'wallet/src/test/utils'

export const searchableRecipient = createFixture<SearchableRecipient>()(() => ({
  address: faker.finance.ethereumAddress(),
  name: faker.name.fullName(),
}))

type RecipientSectionOptions = {
  addresses: string[]
}

export const recipientSection = createFixture<
  SectionListData<SearchableRecipient>,
  RecipientSectionOptions
>(() => ({
  addresses: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
}))(({ addresses }) => ({
  title: faker.lorem.words(),
  data: addresses.map((address) => searchableRecipient({ address })),
}))
