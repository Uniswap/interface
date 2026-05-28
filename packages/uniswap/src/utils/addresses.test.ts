import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'
import { areAddressesEqual, getValidAddress } from 'uniswap/src/utils/addresses'

const SAMPLE_SEED_ADDRESS_1_WITH_SPACE = SAMPLE_SEED_ADDRESS_1 + ' '
const ADDRESS_NO_PREFIX = '71C7656EC7ab88b098defB751B7401B5f6d8976F'
const INSAMPLE_SEED_ADDRESS_1_WRONG_LENGTH = '0x71C7656EC7ab88b098defB751B7401B5f6d8'
const INSAMPLE_SEED_ADDRESS_1_BAD_PREFIX = '1x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const INSAMPLE_SEED_ADDRESS_1_NON_HEX = '0x71C7656EC7ab88b098defB751B7401B5f6d8976G' // contains G

describe(getValidAddress, () => {
  it.each`
    input                                   | expected                                  | checksum | desc
    ${SAMPLE_SEED_ADDRESS_1}                | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}    | ${false} | ${'a valid address expected as lowercase'}
    ${SAMPLE_SEED_ADDRESS_1_WITH_SPACE}     | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}    | ${false} | ${'a valid address with trailing space'}
    ${SAMPLE_SEED_ADDRESS_1}                | ${SAMPLE_SEED_ADDRESS_1}                  | ${true}  | ${'a valid address'}
    ${ADDRESS_NO_PREFIX}                    | ${`0x${ADDRESS_NO_PREFIX}`.toLowerCase()} | ${false} | ${'a valid address without a prefix'}
    ${INSAMPLE_SEED_ADDRESS_1_WRONG_LENGTH} | ${null}                                   | ${false} | ${'address of incorrect length'}
    ${INSAMPLE_SEED_ADDRESS_1_BAD_PREFIX}   | ${null}                                   | ${false} | ${'address with bad prefix (not 0x)'}
    ${INSAMPLE_SEED_ADDRESS_1_NON_HEX}      | ${null}                                   | ${true}  | ${'non hex address'}
    ${null}                                 | ${null}                                   | ${false} | ${'null address'}
    ${undefined}                            | ${null}                                   | ${false} | ${'undefined address'}
    ${{}}                                   | ${null}                                   | ${false} | ${'handles unexpected object'}
    ${{ meow: 'woof' }}                     | ${null}                                   | ${false} | ${'handles unexpected object'}
    ${true}                                 | ${null}                                   | ${false} | ${'handles unexpected boolean'}
  `('$desc for checksum=$checksum $input should return $expected', async ({ input, expected, checksum }) => {
    expect(getValidAddress(input, checksum)).toEqual(expected)
  })
})

describe(areAddressesEqual, () => {
  it.each`
    addressA                               | addressB                                | expected
    ${SAMPLE_SEED_ADDRESS_1}               | ${SAMPLE_SEED_ADDRESS_1}                | ${true}
    ${SAMPLE_SEED_ADDRESS_1.toUpperCase()} | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}  | ${true}
    ${SAMPLE_SEED_ADDRESS_1.toLowerCase()} | ${SAMPLE_SEED_ADDRESS_1.toUpperCase()}  | ${true}
    ${SAMPLE_SEED_ADDRESS_1_WITH_SPACE}    | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}  | ${true}
    ${null}                                | ${null}                                 | ${false}
    ${null}                                | ${undefined}                            | ${false}
    ${undefined}                           | ${undefined}                            | ${false}
    ${SAMPLE_SEED_ADDRESS_1}               | ${SAMPLE_SEED_ADDRESS_2}                | ${false}
    ${SAMPLE_SEED_ADDRESS_1}               | ${INSAMPLE_SEED_ADDRESS_1_WRONG_LENGTH} | ${false}
    ${INSAMPLE_SEED_ADDRESS_1_BAD_PREFIX}  | ${INSAMPLE_SEED_ADDRESS_1_BAD_PREFIX}   | ${false}
  `(`areAddressesEqual should be $expected for $addressA <-> $addressB`, async ({ addressA, addressB, expected }) => {
    expect(areAddressesEqual(addressA, addressB)).toEqual(expected)
  })
})
