import { filterNft } from 'pages/Portfolio/NFTs/utils/filterNfts'
import { NFTItem } from 'uniswap/src/features/nfts/types'

describe('filterNft', () => {
  const createMockNft = (overrides: Partial<NFTItem> = {}): NFTItem => ({
    name: 'Bored Ape #1234',
    collectionName: 'Bored Ape Yacht Club',
    tokenId: '1234',
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    ...overrides,
  })

  describe('when search query is empty', () => {
    it('should return true for empty string', () => {
      const nft = createMockNft()
      expect(filterNft(nft, '')).toBe(true)
    })

    it('should return true for whitespace-only string', () => {
      const nft = createMockNft()
      expect(filterNft(nft, '   ')).toBe(true)
    })

    it('should return true for null/undefined search', () => {
      const nft = createMockNft()
      expect(filterNft(nft, '')).toBe(true)
    })
  })

  describe('when searching by NFT name', () => {
    it('should match exact name', () => {
      const nft = createMockNft({ name: 'Bored Ape #1234' })
      expect(filterNft(nft, 'Bored Ape #1234')).toBe(true)
    })

    it('should match partial name', () => {
      const nft = createMockNft({ name: 'Bored Ape #1234' })
      expect(filterNft(nft, 'Bored')).toBe(true)
    })

    it('should be case-insensitive', () => {
      const nft = createMockNft({ name: 'Bored Ape #1234' })
      expect(filterNft(nft, 'bored')).toBe(true)
      expect(filterNft(nft, 'BORED')).toBe(true)
      expect(filterNft(nft, 'BoReD')).toBe(true)
    })

    it('should not match when name does not contain search term', () => {
      const nft = createMockNft({ name: 'Bored Ape #1234' })
      expect(filterNft(nft, 'CryptoPunk')).toBe(false)
    })

    it('should handle undefined name', () => {
      const nft = createMockNft({
        name: undefined,
        collectionName: undefined,
        tokenId: undefined,
        contractAddress: undefined,
      })
      expect(filterNft(nft, 'Bored')).toBe(false)
    })

    it('should handle null name', () => {
      const nft = createMockNft({
        name: null as any,
        collectionName: undefined,
        tokenId: undefined,
        contractAddress: undefined,
      })
      expect(filterNft(nft, 'Bored')).toBe(false)
    })
  })

  describe('when searching by collection name', () => {
    it('should match exact collection name', () => {
      const nft = createMockNft({ collectionName: 'Bored Ape Yacht Club' })
      expect(filterNft(nft, 'Bored Ape Yacht Club')).toBe(true)
    })

    it('should match partial collection name', () => {
      const nft = createMockNft({ collectionName: 'Bored Ape Yacht Club' })
      expect(filterNft(nft, 'Yacht')).toBe(true)
    })

    it('should be case-insensitive', () => {
      const nft = createMockNft({ collectionName: 'Bored Ape Yacht Club' })
      expect(filterNft(nft, 'yacht')).toBe(true)
      expect(filterNft(nft, 'YACHT')).toBe(true)
      expect(filterNft(nft, 'YaChT')).toBe(true)
    })

    it('should not match when collection name does not contain search term', () => {
      const nft = createMockNft({ collectionName: 'Bored Ape Yacht Club' })
      expect(filterNft(nft, 'CryptoPunks')).toBe(false)
    })

    it('should handle undefined collection name', () => {
      const nft = createMockNft({ collectionName: undefined })
      expect(filterNft(nft, 'Yacht')).toBe(false)
    })
  })

  describe('when searching by token ID', () => {
    it('should match exact token ID', () => {
      const nft = createMockNft({ tokenId: '1234' })
      expect(filterNft(nft, '1234')).toBe(true)
    })

    it('should match partial token ID', () => {
      const nft = createMockNft({ tokenId: '1234' })
      expect(filterNft(nft, '123')).toBe(true)
    })

    it('should be case-insensitive', () => {
      const nft = createMockNft({ tokenId: 'ABC123' })
      expect(filterNft(nft, 'abc')).toBe(true)
      expect(filterNft(nft, 'ABC')).toBe(true)
      expect(filterNft(nft, 'AbC')).toBe(true)
    })

    it('should not match when token ID does not contain search term', () => {
      const nft = createMockNft({ tokenId: '1234' })
      expect(filterNft(nft, '5678')).toBe(false)
    })

    it('should handle undefined token ID', () => {
      const nft = createMockNft({
        tokenId: undefined,
        name: undefined,
        collectionName: undefined,
        contractAddress: undefined,
      })
      expect(filterNft(nft, '1234')).toBe(false)
    })
  })

  describe('when searching by contract address', () => {
    it('should match exact contract address', () => {
      const nft = createMockNft({ contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
      expect(filterNft(nft, '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D')).toBe(true)
    })

    it('should match partial contract address', () => {
      const nft = createMockNft({ contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
      expect(filterNft(nft, 'BC4CA0')).toBe(true)
    })

    it('should be case-insensitive', () => {
      const nft = createMockNft({ contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
      expect(filterNft(nft, 'bc4ca0')).toBe(true)
      expect(filterNft(nft, 'BC4CA0')).toBe(true)
      expect(filterNft(nft, 'Bc4Ca0')).toBe(true)
    })

    it('should not match when contract address does not contain search term', () => {
      const nft = createMockNft({ contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
      expect(filterNft(nft, '0x123456789')).toBe(false)
    })

    it('should handle undefined contract address', () => {
      const nft = createMockNft({ contractAddress: undefined })
      expect(filterNft(nft, 'BC4CA0')).toBe(false)
    })
  })

  describe('when searching with whitespace', () => {
    it('should trim leading and trailing whitespace', () => {
      const nft = createMockNft({ name: 'Bored Ape #1234' })
      expect(filterNft(nft, '  Bored  ')).toBe(true)
      expect(filterNft(nft, '\tBored\n')).toBe(true)
    })

    it('should handle whitespace-only search as empty search', () => {
      const nft = createMockNft()
      expect(filterNft(nft, '   ')).toBe(true)
      expect(filterNft(nft, '\t\n')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle NFT with all undefined fields', () => {
      const nft = createMockNft({
        name: undefined,
        collectionName: undefined,
        tokenId: undefined,
        contractAddress: undefined,
      })
      expect(filterNft(nft, 'anything')).toBe(false)
    })

    it('should handle NFT with empty string fields', () => {
      const nft = createMockNft({
        name: '',
        collectionName: '',
        tokenId: '',
        contractAddress: '',
      })
      expect(filterNft(nft, 'anything')).toBe(false)
    })

    it('should handle special characters in search', () => {
      const nft = createMockNft({ name: 'NFT #1234' })
      expect(filterNft(nft, '#')).toBe(true)
      expect(filterNft(nft, '1234')).toBe(true)
    })

    it('should handle unicode characters', () => {
      const nft = createMockNft({ name: '🚀 Rocket NFT' })
      expect(filterNft(nft, '🚀')).toBe(true)
      expect(filterNft(nft, 'Rocket')).toBe(true)
    })
  })

  describe('real-world examples', () => {
    it('should match Bored Ape Yacht Club NFT', () => {
      const nft = createMockNft({
        name: 'Bored Ape #1234',
        collectionName: 'Bored Ape Yacht Club',
        tokenId: '1234',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      })

      expect(filterNft(nft, 'bored')).toBe(true)
      expect(filterNft(nft, 'ape')).toBe(true)
      expect(filterNft(nft, 'yacht')).toBe(true)
      expect(filterNft(nft, '1234')).toBe(true)
      expect(filterNft(nft, 'BC4CA0')).toBe(true)
    })

    it('should match CryptoPunks NFT', () => {
      const nft = createMockNft({
        name: 'CryptoPunk #1234',
        collectionName: 'CryptoPunks',
        tokenId: '1234',
        contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      })

      expect(filterNft(nft, 'crypto')).toBe(true)
      expect(filterNft(nft, 'punk')).toBe(true)
      expect(filterNft(nft, 'punks')).toBe(true)
      expect(filterNft(nft, '1234')).toBe(true)
    })

    it('should not match unrelated NFTs', () => {
      const nft = createMockNft({
        name: 'Bored Ape #1234',
        collectionName: 'Bored Ape Yacht Club',
        tokenId: '1234',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      })

      expect(filterNft(nft, 'cryptopunk')).toBe(false)
      expect(filterNft(nft, 'azuki')).toBe(false)
      expect(filterNft(nft, '5678')).toBe(false)
    })
  })
})
