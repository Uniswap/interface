import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

/** Unique card test IDs from mock data (nfts.json). Format: PortfolioNftCardPrefix + getNFTAssetKey(contract, tokenId). */
const MOCK_NFT_CARD_IDS = {
  iGotPlenty: `${TestID.PortfolioNftCardPrefix}nftItem.0x3c90502f0cb0ad0a48c51357e65ff15247a1d88e.21`,
  mi: `${TestID.PortfolioNftCardPrefix}nftItem.0x495f947276749ce646f68ac8c248420045cb7b5e.49573910948929644057320032930374483793648558152449286445567646333571629580294`,
  kleefeldTr: `${TestID.PortfolioNftCardPrefix}nftItem.0x495f947276749ce646f68ac8c248420045cb7b5e.49573910948929644057320032930374483793648558152449286445567646332472117952516`,
  kleefeldCh: `${TestID.PortfolioNftCardPrefix}nftItem.0x495f947276749ce646f68ac8c248420045cb7b5e.49573910948929644057320032930374483793648558152449286445567646331372606324740`,
} as const

test.describe(
  'Portfolio NFTs Tab',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('NFT Grid Display', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
      })

      test('should display NFT cards with names', async ({ page }) => {
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.iGotPlenty)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldTr)).toBeVisible()
      })

      test('should display collection names', async ({ page }) => {
        await expect(
          page.getByTestId(MOCK_NFT_CARD_IDS.mi).getByTestId(TestID.PortfolioNftCardCollectionName),
        ).toHaveText('OS Shared Storefront Collection')
      })

      test('should display NFT count in header', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioNftsHeader)).toBeVisible()
      })
    })

    test.describe('Search Functionality', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
      })

      test('should filter NFTs by name', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioNftsSearchInput).fill('Kleefeld')
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldTr)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldCh)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).not.toBeVisible()
      })

      test('should filter NFTs by collection name', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioNftsSearchInput).fill('OS Shared')
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldTr)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.iGotPlenty)).not.toBeVisible()
      })

      test('should show no results message when search has no matches', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioNftsSearchInput).fill('NONEXISTENTNFT123')
        await expect(page.getByTestId(TestID.PortfolioNftsNoResults)).toBeVisible()
      })

      test('should clear search and show all NFTs', async ({ page }) => {
        const searchInput = page.getByTestId(TestID.PortfolioNftsSearchInput)
        await searchInput.fill('Kleefeld')
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).not.toBeVisible()

        await searchInput.clear()

        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).toBeVisible()
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldTr)).toBeVisible()
      })
    })

    test.describe('Empty States', () => {
      test('should show empty state when wallet has no NFTs', async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts_empty)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
        await expect(page.getByTestId(TestID.PortfolioNftsEmptyState)).toBeVisible()
      })

      test('should show chain-specific empty state with filter', async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts_empty)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}&chain=optimism`)
        await expect(page.getByTestId(TestID.PortfolioNftsEmptyState)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioNftsSeeAllNetworksButton)).toBeVisible()
      })

      test('should navigate to all NFTs when clicking "See all networks"', async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts_empty)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}&chain=optimism`)
        await page.getByTestId(TestID.PortfolioNftsSeeAllNetworksButton).click()
        await expect(page).toHaveURL(/\/portfolio\/nfts/)
        expect(page.url()).not.toContain('chain=')
      })
    })

    test.describe('Demo View (Disconnected User)', () => {
      test('should show demo wallet indicator', async ({ page }) => {
        await page.goto('/portfolio/nfts?eagerlyConnect=false')
        await expect(page.getByTestId(TestID.DemoWalletDisplay)).toBeVisible()
      })

      test('should still display NFTs tab content in demo view', async ({ page }) => {
        await page.goto('/portfolio/nfts?eagerlyConnect=false')
        await expect(page.getByTestId(TestID.PortfolioTabNfts)).toBeVisible()
      })
    })

    test.describe('External Wallet View', () => {
      test.beforeEach(async ({ graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
      })

      test('should show NFTs for external wallet', async ({ page }) => {
        await page.goto(`/portfolio/${HAYDEN_ADDRESS}/nfts?eagerlyConnect=false`)
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).toBeVisible()
      })

      test('should preserve external address in URL', async ({ page }) => {
        await page.goto(`/portfolio/${HAYDEN_ADDRESS}/nfts?eagerlyConnect=false`)
        expect(page.url()).toContain(HAYDEN_ADDRESS)
      })

      test('should show share button for external wallet', async ({ page }) => {
        await page.goto(`/portfolio/${HAYDEN_ADDRESS}/nfts?eagerlyConnect=false`)
        await expect(page.getByTestId(TestID.PortfolioShareButton)).toBeVisible()
      })
    })

    test.describe('Responsive Behavior', () => {
      const MOBILE_VIEWPORT = { width: 375, height: 667 }

      test.beforeEach(async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
      })

      test('should display NFTs on mobile', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.mi)).toBeVisible()
      })

      test('should have search input visible on mobile', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
        const searchInput = page.getByTestId(TestID.PortfolioNftsSearchInput)
        await expect(searchInput).toBeVisible()
        await searchInput.fill('Kleefeld')
        await expect(page.getByTestId(MOCK_NFT_CARD_IDS.kleefeldTr)).toBeVisible()
      })
    })

    test.describe('NFT Card Interactions', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
        await page.goto(`/portfolio/nfts?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
      })

      test('should show context menu on NFT card hover', async ({ page }) => {
        const miCard = page.getByTestId(MOCK_NFT_CARD_IDS.mi)
        await expect(miCard).toBeVisible()
        await miCard.hover()
        await expect(page.getByTestId(TestID.PortfolioNftCardContextMenuTrigger).first()).toBeVisible()
      })

      test('should show "View on OpenSea" text on hover', async ({ page }) => {
        const miCard = page.getByTestId(MOCK_NFT_CARD_IDS.mi)
        await expect(miCard).toBeVisible()
        await miCard.hover()
        await expect(page.getByTestId(TestID.PortfolioNftCardViewOnLink).first()).toBeVisible()
      })
    })
  },
)
