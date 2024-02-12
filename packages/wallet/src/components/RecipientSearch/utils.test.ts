import { filterSections } from 'wallet/src/components/RecipientSearch/utils'
import {
  RecipientSections,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
} from 'wallet/src/test/fixtures'

describe(filterSections, () => {
  it('returns empty array if filteredAddresses is empty', () => {
    expect(filterSections(RecipientSections, [])).toEqual([])
  })

  it('filters out empty sections', () => {
    // SAMPLE_SEED_ADDRESS_1 and SAMPLE_SEED_ADDRESS_2 are all addresses used in the fixture
    expect(
      filterSections(RecipientSections, [SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2])
    ).toEqual([RecipientSections[0], RecipientSections[1], RecipientSections[3]])
  })

  it('returns sections corresponding to the filtered addresses with matching addresses', () => {
    expect(filterSections(RecipientSections, [SAMPLE_SEED_ADDRESS_1])).toEqual([
      {
        title: RecipientSections[0].title,
        data: [RecipientSections[0].data[0]], // only the first item in the first section matches
      },
      RecipientSections[1],
    ])

    expect(filterSections(RecipientSections, [SAMPLE_SEED_ADDRESS_2])).toEqual([
      {
        title: RecipientSections[0].title,
        data: [RecipientSections[0].data[1]], // only the second item in the first section matches
      },
      RecipientSections[3],
    ])
  })
})
