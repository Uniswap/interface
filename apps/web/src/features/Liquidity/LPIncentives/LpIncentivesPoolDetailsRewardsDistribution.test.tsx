import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { RewardsCampaign } from '~/data/pools/poolData'
import { LpIncentivesPoolDetailsRewardsDistribution } from '~/features/Liquidity/LPIncentives/LpIncentivesPoolDetailsRewardsDistribution'
import { render, screen } from '~/test-utils/render'

const USDC = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')

// Fixed so the elapsed-time bar and "days left" copy don't drift with the clock.
const START = 1_700_000_000
const END = START + 30 * 24 * 60 * 60

const campaign = (overrides: Partial<RewardsCampaign> = {}): RewardsCampaign => ({
  id: 'campaign-1',
  boostedApr: 4.5,
  token: USDC,
  startTimestamp: START,
  endTimestamp: END,
  totalRewardAllocation: '1000000000',
  distributedRewards: '250000000',
  ...overrides,
})

describe('LpIncentivesPoolDetailsRewardsDistribution', () => {
  it('renders the distributed-vs-total and campaign-window halves', () => {
    render(<LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={campaign()} />)

    expect(screen.getByText('Rewards distribution')).toBeInTheDocument()
    expect(screen.getByText('Time period')).toBeInTheDocument()
  })

  // The copy itself lives in the shared tooltip and only mounts on hover; this pins that the
  // header carries the affordance at all, which is the whole of this change.
  it('offers the rewards info affordance from the header', () => {
    render(<LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={campaign()} />)

    expect(screen.getByTestId(TestID.LpIncentivesInfoTooltip)).toBeInTheDocument()
  })

  it('denominates the amounts in the served campaign token', () => {
    // Read off the container because each row interleaves amount, symbol and fiat as sibling nodes.
    const { container } = render(<LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={campaign()} />)

    // Asserted through the fiat column because it pins the decimals: the raw amounts are only worth
    // $250 of $1K when read at USDC's 6, and would scale to dust at an 18-decimal token's.
    expect(container.textContent).toContain('$250.00')
    expect(container.textContent).toContain('$1.0K')
    expect(container.textContent).toContain('USDC')
  })

  // There is no stand-in denomination: the totals are raw base units, so reading them at another
  // token's decimals would print a different number rather than a slightly wrong label.
  it('renders nothing when the campaign carries no token', () => {
    const { container } = render(
      <LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={campaign({ token: undefined })} />,
    )

    expect(container.textContent).toBe('')
  })

  it('renders nothing without a campaign', () => {
    const { container } = render(<LpIncentivesPoolDetailsRewardsDistribution />)

    expect(container.textContent).toBe('')
  })

  // The parser withholds the allocation whenever it can't name the token, so this is the same case
  // as above in practice — asserted separately because either condition alone keeps the card off.
  it('renders nothing when the campaign has no total allocation', () => {
    const { container } = render(
      <LpIncentivesPoolDetailsRewardsDistribution rewardsCampaign={campaign({ totalRewardAllocation: undefined })} />,
    )

    expect(container.textContent).toBe('')
  })
})
