import { SectionListData } from 'react-native'
import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import { SearchableRecipient } from 'wallet/src/features/address/types'

export const searchableRecipient = createFixture<SearchableRecipient>()(() => ({
  address: faker.finance.ethereumAddress(),
  name: faker.name.fullName(),
}))

type RecipientSectionOptions = {
  addresses: string[]
}

export const recipientSection = createFixture<SectionListData<SearchableRecipient>, RecipientSectionOptions>(() => ({
  addresses: [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()],
}))(({ addresses }) => ({
  title: faker.lorem.words(),
  data: addresses.map((address) => searchableRecipient({ address })),
}))
