import userEvent from '@testing-library/user-event'
import { UniverseChainId } from '@universe/chains'
import { zIndexes } from '@universe/mycelium'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { HookDetailsDeploymentAddressRows } from '~/pages/HookDetails/components/HookDetailsDeploymentAddressRows'
import { render, screen, waitFor, within } from '~/test-utils/render'

vi.mock('utilities/src/clipboard/clipboard', () => ({ setClipboard: vi.fn().mockResolvedValue(undefined) }))

const CONTRACT_A = '0x1111111111111111111111111111111111111111'
const CONTRACT_B = '0x2222222222222222222222222222222222222222'
const CONTRACT_C = '0x3333333333333333333333333333333333333333'
const DEPLOYER_A = '0x4444444444444444444444444444444444444444'
const DEPLOYER_B = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const DEPLOYER_B_CHECKSUMMED = '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD'
const DEPLOYMENTS = [
  { chainId: UniverseChainId.Mainnet, address: CONTRACT_A, deployerAddress: DEPLOYER_A },
  { chainId: UniverseChainId.Base, address: CONTRACT_B, deployerAddress: DEPLOYER_B.toUpperCase() },
  { chainId: UniverseChainId.Unichain, address: CONTRACT_C, deployerAddress: DEPLOYER_B },
]

afterEach(() => {
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('HookDetailsDeploymentAddressRows', () => {
  it('copies complete single-network addresses and links each value to the chain’s address explorer', async () => {
    const user = userEvent.setup()
    render(<HookDetailsDeploymentAddressRows deployments={[DEPLOYMENTS[0]!]} />)

    const deployer = within(screen.getByRole('group', { name: 'Deployer' }))
    const contract = within(screen.getByRole('group', { name: 'Contract' }))
    expect(deployer.getByText(shortenAddress({ address: DEPLOYER_A }))).toBeVisible()
    expect(contract.getByText(shortenAddress({ address: CONTRACT_A }))).toBeVisible()
    expect(deployer.queryByRole('button', { name: /View deployers/ })).toBeNull()

    await user.click(deployer.getByRole('button', { name: `Copy deployer address ${DEPLOYER_A}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(DEPLOYER_A)
    await user.click(contract.getByRole('button', { name: `Copy contract address ${CONTRACT_A}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(CONTRACT_A)

    for (const [row, address] of [
      [deployer, DEPLOYER_A],
      [contract, CONTRACT_A],
    ] as const) {
      const link = row.getByRole('link', {
        name: `View ${address} on Ethereum explorer (opens in a new tab)`,
      })
      expect(link).toHaveAttribute(
        'href',
        getExplorerLink({ chainId: UniverseChainId.Mainnet, data: address, type: ExplorerDataType.ADDRESS }),
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.querySelector('button, [role="button"], a')).toBeNull()
    }
  })

  it('groups equal deployer addresses once while retaining distinct per-network explorer links', async () => {
    const user = userEvent.setup()
    render(<HookDetailsDeploymentAddressRows deployments={DEPLOYMENTS} />)
    await user.click(screen.getByRole('button', { name: 'View deployers, 2 known addresses' }))
    const dialogElement = screen.getByRole('dialog', { name: 'Deployers' })
    const dialog = within(dialogElement)

    expect(dialogElement.style.zIndex).toBe(String(zIndexes.popover))
    expect(dialog.getAllByRole('button', { name: /Copy deployer address/ })).toHaveLength(2)
    expect(dialog.getByText(shortenAddress({ address: DEPLOYER_B }))).toBeVisible()
    for (const deployment of DEPLOYMENTS) {
      const address = deployment.chainId === UniverseChainId.Mainnet ? DEPLOYER_A : DEPLOYER_B
      const network = getChainLabel(deployment.chainId)
      expect(
        dialog.getByRole('link', { name: `View ${address} on ${network} explorer (opens in a new tab)` }),
      ).toHaveAttribute(
        'href',
        getExplorerLink({ chainId: deployment.chainId, data: address, type: ExplorerDataType.ADDRESS }),
      )
    }
    await user.click(dialog.getByRole('button', { name: `Copy deployer address ${DEPLOYER_B}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(DEPLOYER_B_CHECKSUMMED)
  })

  it('copies the checksummed contract and deployer on a single network', async () => {
    const user = userEvent.setup()
    render(
      <HookDetailsDeploymentAddressRows
        deployments={[{ ...DEPLOYMENTS[0]!, address: DEPLOYER_B, deployerAddress: DEPLOYER_B }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: `Copy deployer address ${DEPLOYER_B}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(DEPLOYER_B_CHECKSUMMED)
    await user.click(screen.getByRole('button', { name: `Copy contract address ${DEPLOYER_B}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(DEPLOYER_B_CHECKSUMMED)
  })

  it('uses each deployment’s contract and counts unique normalized addresses, not chain entries', async () => {
    const user = userEvent.setup()
    const duplicate = { ...DEPLOYMENTS[0]!, address: CONTRACT_A.toUpperCase() }
    const sameAddressOnBase = { ...DEPLOYMENTS[1]!, address: CONTRACT_A }
    render(<HookDetailsDeploymentAddressRows deployments={[DEPLOYMENTS[0]!, duplicate, sameAddressOnBase]} />)
    await user.click(screen.getByRole('button', { name: 'View contracts, 1 address' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Contracts' }))

    expect(dialog.getAllByRole('button', { name: `Copy contract address ${CONTRACT_A}` })).toHaveLength(1)
    expect(dialog.getAllByRole('link')).toHaveLength(2)
    for (const chainId of [UniverseChainId.Mainnet, UniverseChainId.Base]) {
      expect(
        dialog.getByRole('link', {
          name: `View ${CONTRACT_A} on ${getChainLabel(chainId)} explorer (opens in a new tab)`,
        }),
      ).toHaveAttribute('href', getExplorerLink({ chainId, data: CONTRACT_A, type: ExplorerDataType.ADDRESS }))
    }
  })

  it('keeps different contract addresses mapped to their own networks', async () => {
    const user = userEvent.setup()
    render(<HookDetailsDeploymentAddressRows deployments={DEPLOYMENTS} />)
    await user.click(screen.getByRole('button', { name: 'View contracts, 3 addresses' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Contracts' }))

    for (const { chainId, address } of DEPLOYMENTS) {
      expect(
        dialog.getByRole('link', {
          name: `View ${address} on ${getChainLabel(chainId)} explorer (opens in a new tab)`,
        }),
      ).toHaveAttribute('href', getExplorerLink({ chainId, data: address, type: ExplorerDataType.ADDRESS }))
    }
  })

  it('shows missing deployer information without fabricating an address or explorer link', () => {
    render(<HookDetailsDeploymentAddressRows deployments={[{ ...DEPLOYMENTS[0]!, deployerAddress: null }]} />)
    const row = within(screen.getByRole('group', { name: 'Deployer' }))

    expect(row.getByText('Unavailable')).toBeVisible()
    expect(row.queryByRole('button')).toBeNull()
    expect(row.queryByRole('link')).toBeNull()
    expect(screen.getByRole('group', { name: 'Contract' })).toHaveTextContent(shortenAddress({ address: CONTRACT_A }))
  })

  it('retains an unavailable deployer’s network without counting it as a known address', async () => {
    const user = userEvent.setup()
    render(
      <HookDetailsDeploymentAddressRows
        deployments={[{ ...DEPLOYMENTS[0]!, deployerAddress: null }, DEPLOYMENTS[1]!]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'View deployers, 1 known address' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Deployers' }))

    expect(dialog.getByText('Unavailable')).toBeVisible()
    expect(dialog.getByText('Ethereum')).toBeVisible()
    expect(dialog.queryByRole('link', { name: /Ethereum/ })).toBeNull()
    expect(dialog.getAllByRole('link')).toHaveLength(1)
    expect(dialog.getByRole('button', { name: `Copy deployer address ${DEPLOYER_B}` })).toBeVisible()
  })

  it('shows unavailable instead of a zero-address count when every deployer is unknown', () => {
    render(
      <HookDetailsDeploymentAddressRows
        deployments={DEPLOYMENTS.map((deployment) => ({ ...deployment, deployerAddress: null }))}
      />,
    )
    const row = within(screen.getByRole('group', { name: 'Deployer' }))
    expect(row.getByText('Unavailable')).toBeVisible()
    expect(row.queryByRole('link')).toBeNull()
    expect(row.queryByRole('button')).toBeNull()
  })

  it('supports keyboard opening, Escape dismissal and focus restoration, plus outside dismissal', async () => {
    const user = userEvent.setup()
    render(
      <>
        <HookDetailsDeploymentAddressRows deployments={DEPLOYMENTS} />
        <button>Outside</button>
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'View contracts, 3 addresses' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'Contracts' })).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Contracts' })).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())

    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: 'Contracts' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Contracts' })).toBeNull())
  })

  it('keeps deployment interactions on the detail page and opens explorer links separately', async () => {
    const user = userEvent.setup()
    render(<HookDetailsDeploymentAddressRows deployments={DEPLOYMENTS} />)
    await user.click(screen.getByRole('button', { name: 'View contracts, 3 addresses' }))
    const dialogElement = screen.getByRole('dialog', { name: 'Contracts' })
    const dialog = within(dialogElement)
    expect(dialogElement.closest('a')).toBeNull()
    await user.click(dialog.getByText('Contracts'))
    await user.click(dialog.getByRole('button', { name: `Copy contract address ${CONTRACT_A}` }))
    expect(setClipboard).toHaveBeenLastCalledWith(CONTRACT_A)
    await user.click(
      dialog.getByRole('link', {
        name: `View ${CONTRACT_A} on Ethereum explorer (opens in a new tab)`,
      }),
    )

    expect(window.location.pathname).toBe('/')
    expect(dialogElement.querySelector('a a')).toBeNull()
  })
})
