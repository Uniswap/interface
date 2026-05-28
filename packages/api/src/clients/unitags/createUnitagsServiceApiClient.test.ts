import 'utilities/src/logger/mocks'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@universe/api/src/clients/base/auth', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/api/src/clients/base/auth')>()
  return {
    ...mod,
    signUnitagServiceMessage: vi.fn(),
  }
})

import {
  AvatarUploadRequest,
  AvatarUploadResponse,
  CanClaimUsernameRequest,
  CanClaimUsernameResponse,
  ChangeUsernameRequest,
  ClaimUsernameRequest,
  GetAddressRequest,
  GetAddressResponse,
  GetAddressesRequest,
  GetAddressesResponse,
  GetUsernameRequest,
  GetUsernameResponse,
  RemoveUsernameRequest,
  SuccessResponse,
  UpdateProfileMetadataRequest,
  UpdateProfileMetadataResponse,
} from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'
import { signUnitagServiceMessage, NEW_UNITAGS_SIGNATURE_HEADER } from '@universe/api/src/clients/base/auth'
import { createUnitagServiceApiClient } from './createUnitagsServiceApiClient'

describe('UnitagsServiceApiClient', () => {
  const mockSign = signUnitagServiceMessage as unknown as Mock

  function makeRpcClient() {
    return {
      getUsername: vi.fn(),
      canClaimUsername: vi.fn(),
      getAddress: vi.fn(),
      getAddresses: vi.fn(),
      claimUsername: vi.fn(),
      changeUsername: vi.fn(),
      removeUsername: vi.fn(),
      avatarUpload: vi.fn(),
      updateProfileMetadata: vi.fn(),
      ccipRead: vi.fn(),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSign.mockImplementation(
      async (params: { data: unknown; address: string; signMessage: () => Promise<string> }) => ({
        data: params.data,
        signature: 'mock-signature',
      }),
    )
  })

  describe('signed RPC calls', () => {
    it('should sign claimUnitag and pass signature header to claimUsername', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new ClaimUsernameRequest({ username: 'testuser', deviceId: 'device123' })
      const success = new SuccessResponse({ success: true })
      rpcClient.claimUsername.mockResolvedValue(success)

      const result = await client.claimUnitag({ data, address: '0x123', signMessage })

      expect(mockSign).toHaveBeenCalledWith({ data, address: '0x123', signMessage })
      expect(rpcClient.claimUsername).toHaveBeenCalledWith(data, {
        headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: 'mock-signature' },
      })
      expect(result).toBe(success)
    })

    it('should sign changeUnitag and pass signature header to changeUsername', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new ChangeUsernameRequest({ username: 'newuser', deviceId: 'device123' })
      const success = new SuccessResponse({ success: true })
      rpcClient.changeUsername.mockResolvedValue(success)

      await client.changeUnitag({ data, address: '0x123', signMessage })

      expect(mockSign).toHaveBeenCalledWith({ data, address: '0x123', signMessage })
      expect(rpcClient.changeUsername).toHaveBeenCalledWith(data, {
        headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: 'mock-signature' },
      })
    })

    it('should sign deleteUnitag and pass signature header to removeUsername', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new RemoveUsernameRequest({ username: 'testuser' })
      const success = new SuccessResponse({ success: true })
      rpcClient.removeUsername.mockResolvedValue(success)

      await client.deleteUnitag({ data, address: '0x123', signMessage })

      expect(mockSign).toHaveBeenCalledWith({ data, address: '0x123', signMessage })
      expect(rpcClient.removeUsername).toHaveBeenCalledWith(data, {
        headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: 'mock-signature' },
      })
    })

    it('should sign getUnitagAvatarUploadUrl and pass signature header to avatarUpload', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new AvatarUploadRequest({ username: 'testuser' })
      const uploadResponse = new AvatarUploadResponse({
        success: true,
        preSignedUrl: 'https://upload.example/presign',
        s3UploadFields: {},
      })
      rpcClient.avatarUpload.mockResolvedValue(uploadResponse)

      await client.getUnitagAvatarUploadUrl({ data, address: '0x123', signMessage })

      expect(mockSign).toHaveBeenCalledWith({ data, address: '0x123', signMessage })
      expect(rpcClient.avatarUpload).toHaveBeenCalledWith(data, {
        headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: 'mock-signature' },
      })
    })

    it('should sign updateUnitagMetadata and pass signature header to updateProfileMetadata', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new UpdateProfileMetadataRequest({
        username: 'testuser',
        metadata: { description: 'updated' },
      })
      const metaResponse = new UpdateProfileMetadataResponse({
        success: true,
        metadata: { avatar: 'https://example.com/avatar.png' },
      })
      rpcClient.updateProfileMetadata.mockResolvedValue(metaResponse)

      await client.updateUnitagMetadata({ data, address: '0x123', signMessage })

      expect(mockSign).toHaveBeenCalledWith({ data, address: '0x123', signMessage })
      expect(rpcClient.updateProfileMetadata).toHaveBeenCalledWith(data, {
        headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: 'mock-signature' },
      })
    })
  })

  describe('avatar sanitization in responses', () => {
    it('should sanitize avatar URL in fetchUsername response', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      rpcClient.getUsername.mockResolvedValue(
        new GetUsernameResponse({
          available: true,
          requiresEnsMatch: false,
          metadata: { avatar: 'https://example.com/avatar.png', description: 'test' },
        }),
      )

      const safe = await client.fetchUsername(new GetUsernameRequest({ username: 'u' }))
      expect(safe.metadata?.avatar).toBe('https://example.com/avatar.png')

      rpcClient.getUsername.mockResolvedValue(
        new GetUsernameResponse({
          available: true,
          requiresEnsMatch: false,
          // oxlint-disable-next-line no-script-url
          metadata: { avatar: 'javascript:alert(1)', description: 'test' },
        }),
      )
      const malicious = await client.fetchUsername(new GetUsernameRequest({ username: 'u' }))
      expect(malicious.metadata?.avatar).toBeUndefined()
    })

    it('should sanitize avatar URL in fetchAddress response', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      rpcClient.getAddress.mockResolvedValue(
        new GetAddressResponse({
          username: 'test',
          metadata: { avatar: 'https://example.com/avatar.png' },
        }),
      )
      const safe = await client.fetchAddress(new GetAddressRequest({ address: '0x' }))
      expect(safe.metadata?.avatar).toBe('https://example.com/avatar.png')

      rpcClient.getAddress.mockResolvedValue(
        new GetAddressResponse({
          username: 'test',
          metadata: { avatar: 'ipfs://QmHash123' },
        }),
      )
      const malicious = await client.fetchAddress(new GetAddressRequest({ address: '0x' }))
      expect(malicious.metadata?.avatar).toBeUndefined()
    })

    it('should sanitize avatar URLs in fetchUnitagsByAddresses response', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      rpcClient.getAddresses.mockResolvedValue(
        new GetAddressesResponse({
          usernames: {
            '0x123': new GetAddressResponse({
              username: 'user1',
              metadata: { avatar: 'https://example.com/1.png' },
            }),
            '0x456': new GetAddressResponse({
              username: 'user2',
              metadata: { avatar: 'data:image/png;base64,abc' },
            }),
          },
        }),
      )

      const result = await client.fetchUnitagsByAddresses(new GetAddressesRequest({ addresses: ['0x123', '0x456'] }))
      expect(result.usernames['0x123']?.metadata?.avatar).toBe('https://example.com/1.png')
      expect(result.usernames['0x456']?.metadata?.avatar).toBeUndefined()
    })

    it('should sanitize avatar URL in updateUnitagMetadata response', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const signMessage = vi.fn().mockResolvedValue('mock-signature')
      const data = new UpdateProfileMetadataRequest({ username: 'u', metadata: {} })

      rpcClient.updateProfileMetadata.mockResolvedValue(
        new UpdateProfileMetadataResponse({
          success: true,
          metadata: { avatar: 'https://example.com/avatar.png' },
        }),
      )
      const safe = await client.updateUnitagMetadata({ data, address: '0x123', signMessage })
      expect(safe.metadata?.avatar).toBe('https://example.com/avatar.png')

      rpcClient.updateProfileMetadata.mockResolvedValue(
        new UpdateProfileMetadataResponse({
          success: true,
          metadata: { avatar: 'file:///etc/passwd' },
        }),
      )
      const malicious = await client.updateUnitagMetadata({ data, address: '0x123', signMessage })
      expect(malicious.metadata?.avatar).toBeUndefined()
    })
  })

  describe('pass-through RPC (no avatar transform)', () => {
    it('should forward fetchClaimEligibility without signing', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const req = new CanClaimUsernameRequest({ deviceId: 'device-x' })
      const res = new CanClaimUsernameResponse({ canClaim: true })
      rpcClient.canClaimUsername.mockResolvedValue(res)

      const out = await client.fetchClaimEligibility(req)

      expect(mockSign).not.toHaveBeenCalled()
      expect(rpcClient.canClaimUsername).toHaveBeenCalledWith(req)
      expect(out).toBe(res)
    })
  })

  describe('client instance', () => {
    it('should expose all service methods', () => {
      const client = createUnitagServiceApiClient({ rpcClient: makeRpcClient() })
      expect(client.fetchUsername).toBeDefined()
      expect(client.fetchAddress).toBeDefined()
      expect(client.fetchUnitagsByAddresses).toBeDefined()
      expect(client.fetchClaimEligibility).toBeDefined()
      expect(client.claimUnitag).toBeDefined()
      expect(client.updateUnitagMetadata).toBeDefined()
      expect(client.changeUnitag).toBeDefined()
      expect(client.deleteUnitag).toBeDefined()
      expect(client.getUnitagAvatarUploadUrl).toBeDefined()
    })

    it('should call getUsername with request params', async () => {
      const rpcClient = makeRpcClient()
      const client = createUnitagServiceApiClient({ rpcClient })
      const req = new GetUsernameRequest({ username: 'test' })
      const res = new GetUsernameResponse({ username: 'test', address: '0x123' })
      rpcClient.getUsername.mockResolvedValue(res)

      const result = await client.fetchUsername(req)

      expect(rpcClient.getUsername).toHaveBeenCalledWith(req)
      expect(result.username).toBe('test')
      expect(result.address).toBe('0x123')
    })
  })
})
