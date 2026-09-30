import { getBlockaidScanTransactionResponseSchema } from '@universe/api/src/clients/blockaid/types'
import { describe, expect, it } from 'vitest'

describe('getBlockaidScanTransactionResponseSchema', () => {
  it('preserves NFT approval scope and exposure details', () => {
    const result = getBlockaidScanTransactionResponseSchema().parse({
      block: '1',
      chain: 'ethereum',
      simulation: {
        status: 'Success',
        assets_diffs: {},
        transaction_actions: ['approval'],
        total_usd_diff: {},
        exposures: {},
        total_usd_exposure: {},
        address_details: {},
        account_summary: {
          assets_diffs: [],
          traces: [],
          total_usd_diff: { in: '0', out: '0', total: '0' },
          total_usd_exposure: {},
          exposures: [
            {
              asset_type: 'ERC721',
              asset: {
                type: 'ERC721',
                address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                symbol: 'BAYC',
              },
              spenders: {
                '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2': {
                  exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
                  is_approved_for_all: false,
                },
              },
            },
            {
              asset_type: 'ERC1155',
              asset: {
                type: 'ERC1155',
                address: '0x495f947276749ce646f68ac8c248420045cb7b5e',
                name: 'Collection',
              },
              spenders: {
                '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2': {
                  exposure: [{ token_id: '42', value: '1', arbitrary_collection_token: false }],
                  is_approved_for_all: true,
                },
              },
            },
          ],
        },
      },
    })

    const [erc721, erc1155] = result.simulation?.status === 'Success' ? result.simulation.account_summary.exposures : []
    const erc721Spender = erc721?.spenders['0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2']
    const erc1155Spender = erc1155?.spenders['0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2']

    expect(erc721Spender).toMatchObject({
      is_approved_for_all: false,
      exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
    })
    expect(erc1155Spender).toMatchObject({
      is_approved_for_all: true,
      exposure: [{ token_id: '42', value: '1', arbitrary_collection_token: false }],
    })
  })

  it('accepts NONERC assets and balance changes without a decimal value (Arc scan response)', () => {
    const ROUTER = '0x4fcA4a51Ab4F23A7447b3284fBd7D73289A89Fb1'
    const ACCOUNT = '0x1111111111111111111111111111111111111111'
    const USDC = '0x3600000000000000000000000000000000000000'
    const NONERC_PSEUDO_ASSET = '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE'
    const nonErcDiff = {
      asset_type: 'ERC20',
      asset: { address: NONERC_PSEUDO_ASSET, type: 'NONERC' },
      in: [],
      out: [{ raw_value: '0x3cb71f51fc5580000' }],
      balance_changes: {
        before: { raw_value: '0x56bc75e2d63100000' },
        after: { raw_value: '0x1a055690d9db80000' },
      },
    }
    const usdcDiff = {
      asset_type: 'ERC20',
      asset: { type: 'ERC20', address: USDC, name: 'USDC', symbol: 'USDC', decimals: 6 },
      in: [{ value: '1', raw_value: '0xf4240', usd_price: '1.00' }],
      out: [],
    }

    const result = getBlockaidScanTransactionResponseSchema().safeParse({
      block: '1234567',
      chain: '5042',
      account_address: ACCOUNT,
      validation: {
        status: 'Success',
        result_type: 'Benign',
        description: '',
        reason: '',
        classification: '',
        features: [],
      },
      simulation: {
        status: 'Success',
        assets_diffs: { [ROUTER]: [usdcDiff, nonErcDiff], [ACCOUNT]: [usdcDiff] },
        transaction_actions: ['swap'],
        total_usd_diff: {},
        exposures: {},
        total_usd_exposure: {},
        address_details: {},
        account_summary: {
          assets_diffs: [usdcDiff, nonErcDiff],
          traces: [
            {
              type: 'ERC20',
              trace_type: 'AssetTrace',
              from_address: ROUTER,
              to_address: ACCOUNT,
              asset: { address: NONERC_PSEUDO_ASSET, type: 'NONERC' },
              diff: { raw_value: '0x3cb71f51fc5580000' },
            },
          ],
          total_usd_diff: { in: '1', out: '0', total: '1' },
          exposures: [],
          total_usd_exposure: {},
        },
      },
    })

    expect(result.success).toBe(true)
    if (!result.success || result.data.simulation?.status !== 'Success') {
      return
    }
    const nonErcAsset = result.data.simulation.account_summary.assets_diffs[1]?.asset
    expect(nonErcAsset).toEqual({ address: NONERC_PSEUDO_ASSET, type: 'NONERC' })
    expect(result.data.simulation.account_summary.traces[0]?.asset.type).toBe('NONERC')
  })

  it('still rejects an asset whose type is not a known Blockaid asset kind', () => {
    const result = getBlockaidScanTransactionResponseSchema().safeParse({
      block: '1',
      chain: '5042',
      simulation: {
        status: 'Success',
        assets_diffs: {},
        transaction_actions: [],
        total_usd_diff: {},
        exposures: {},
        total_usd_exposure: {},
        address_details: {},
        account_summary: {
          assets_diffs: [
            {
              asset_type: 'ERC20',
              asset: { address: '0x3600000000000000000000000000000000000000', type: 'SOMETHING_NEW' },
              in: [],
              out: [],
            },
          ],
          traces: [],
          exposures: [],
          total_usd_exposure: {},
        },
      },
    })

    expect(result.success).toBe(false)
  })
})
