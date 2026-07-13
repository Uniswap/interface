import { Code, ConnectError } from '@connectrpc/connect'
import { useMutation } from '@tanstack/react-query'
import type { VerifyTokenFactoryImageResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { VerifyTokenFactoryImageResponse_Status } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useCallback, useRef, useState, type MutableRefObject } from 'react'
import { createTokenFactoryPresignedUrl, verifyTokenFactoryImage } from 'uniswap/src/data/rest/tokenFactoryImage'
import { sleep } from 'utilities/src/time/timing'
import type { CreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
  useCreateAuctionStoreBase,
} from '~/pages/Liquidity/CreateAuction/store/useCreateAuctionStore'
import { TokenMode } from '~/pages/Liquidity/CreateAuction/types'
import { resolveTokenImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveTokenImageSrc'
import { selectTokenImageFile } from '~/pages/Liquidity/CreateAuction/utils/selectTokenImageFile'
import { uploadImageToPinata } from '~/pages/Liquidity/CreateAuction/utils/uploadImageToPinata'

export type TokenImageUploadStatus = 'idle' | 'uploading' | 'verifying' | 'success' | 'error'

/** Stable, presentation-agnostic failure reasons. The component maps these to localized copy. */
export type TokenImageUploadErrorReason = 'invalid-type' | 'too-large' | 'rejected' | 'upload-failed'

export interface UseTokenImageUploadResult {
  status: TokenImageUploadStatus
  errorReason?: TokenImageUploadErrorReason
  /** Same as `localImagePreviewUri` on the create-new token form; survives step navigation. */
  previewUri?: string
  start: () => void
}

// Tuned for IPFS gateway cold-pull right after upload — a fresh CID often isn't fetchable for a
// second or two. Refine against the live latency if needed.
export const VERIFY_MAX_ATTEMPTS = 4
export const VERIFY_RETRY_DELAY_MS = 1500

/**
 * The backend returns HTTP 500 "Image scan temporarily unavailable" while a freshly-uploaded CID is
 * still propagating to the IPFS gateway — the normal path right after upload, not a hard failure.
 * Verified live: that 500 surfaces as ConnectError code Unknown (2); we also accept Internal /
 * Unavailable defensively. A bad CID is InvalidArgument and must not retry.
 */
function isTransientScanError(error: unknown): boolean {
  return (
    error instanceof ConnectError &&
    (error.code === Code.Unavailable || error.code === Code.Internal || error.code === Code.Unknown)
  )
}

async function verifyWithRetry(cid: string): Promise<VerifyTokenFactoryImageResponse> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await verifyTokenFactoryImage(cid)
    } catch (error) {
      if (attempt >= VERIFY_MAX_ATTEMPTS || !isTransientScanError(error)) {
        throw error
      }
      await sleep(VERIFY_RETRY_DELAY_MS)
    }
  }
}

function revokeIfBlob(uri: string): void {
  if (uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri)
  }
}

function clearLocalImagePreview(store: CreateAuctionStore): void {
  const tf = store.getState().tokenForm
  if (tf.mode === TokenMode.CREATE_NEW && tf.localImagePreviewUri) {
    revokeIfBlob(tf.localImagePreviewUri)
    store.getState().actions.updateCreateNewTokenField('localImagePreviewUri', '')
  }
}

function setLocalImagePreview(store: CreateAuctionStore, uri: string): void {
  const tf = store.getState().tokenForm
  if (tf.mode === TokenMode.CREATE_NEW && tf.localImagePreviewUri) {
    revokeIfBlob(tf.localImagePreviewUri)
  }
  store.getState().actions.updateCreateNewTokenField('localImagePreviewUri', uri)
}

function scheduleClearLocalWhenGatewayImageReady(options: {
  store: CreateAuctionStore
  cid: string
  objectUrl: string
  attempt: number
  latestAttemptRef: MutableRefObject<number>
}): void {
  const { store, cid, objectUrl, attempt, latestAttemptRef } = options
  const resolved = resolveTokenImageSrc(`ipfs://${cid}`)
  if (!resolved) {
    clearLocalImagePreview(store)
    return
  }

  const img = new Image()
  img.onload = () => {
    if (attempt !== latestAttemptRef.current) {
      return
    }
    const tf = store.getState().tokenForm
    // Stale preload after unmount/remount: `latestAttemptRef` can match a new pick's attempt index
    // while this handler still refers to an older `objectUrl`. Only clear when the store still
    // points at this blob.
    if (tf.mode !== TokenMode.CREATE_NEW || tf.localImagePreviewUri !== objectUrl) {
      return
    }
    revokeIfBlob(objectUrl)
    store.getState().actions.updateCreateNewTokenField('localImagePreviewUri', '')
  }
  // Keep the blob visible if the gateway is slow or blocked by network; the next navigation or
  // pick still clears via clearLocalImagePreview / setLocalImagePreview.
  img.onerror = () => undefined
  img.src = resolved
}

/**
 * Drives the token-logo upload: pick -> validate -> presign -> upload to Pinata -> verify (with retry
 * on the transient scan error). Writes `ipfs://<cid>` to the store's `imageUrl` when the image is
 * approved — or when moderation can't complete after retries, in which case we attach optimistically
 * and let the backend re-verify later. A moderation block or an upload failure surfaces an error; a
 * verification that simply couldn't run does not. The image is optional and never blocks the step.
 *
 * The picked file is shown immediately via `localImagePreviewUri` (a blob URL) on the token form so it
 * survives leaving step 1. After `ipfs://` is saved, a background preload swaps the blob away only
 * once the Pinata HTTPS URL loads.
 */
export function useTokenImageUpload(): UseTokenImageUploadResult {
  const { updateCreateNewTokenField } = useCreateAuctionStoreActions()
  const store = useCreateAuctionStoreBase()
  const [status, setStatus] = useState<TokenImageUploadStatus>('idle')
  const [errorReason, setErrorReason] = useState<TokenImageUploadErrorReason>()

  const latestAttemptRef = useRef(0)

  const previewUri = useCreateAuctionStore((s) =>
    s.tokenForm.mode === TokenMode.CREATE_NEW ? s.tokenForm.localImagePreviewUri || undefined : undefined,
  )

  const { mutateAsync } = useMutation({
    mutationFn: async ({
      file,
      attempt,
    }: {
      file: File
      attempt: number
    }): Promise<{ cid: string; response?: VerifyTokenFactoryImageResponse }> => {
      const signedUrl = await createTokenFactoryPresignedUrl(file.name)
      const cid = await uploadImageToPinata(signedUrl, file)
      if (attempt === latestAttemptRef.current) {
        setStatus('verifying')
      }
      try {
        return { cid, response: await verifyWithRetry(cid) }
      } catch {
        // The upload succeeded but moderation couldn't complete (scan service unavailable / retries
        // exhausted). Keep the image optimistically and let the backend re-verify later rather than
        // blocking the user on a transient failure — only a hard upload failure rejects from here.
        return { cid }
      }
    },
  })

  const runFlow = useCallback(async (): Promise<void> => {
    const selection = await selectTokenImageFile()
    if (selection.kind === 'cancelled') {
      return
    }

    const attempt = (latestAttemptRef.current += 1)

    if (selection.kind === 'invalid-type' || selection.kind === 'too-large') {
      setStatus('error')
      setErrorReason(selection.kind)
      clearLocalImagePreview(store)
      return
    }

    setErrorReason(undefined)
    setStatus('uploading')
    const objectUrl = URL.createObjectURL(selection.file)
    setLocalImagePreview(store, objectUrl)

    try {
      const { cid, response } = await mutateAsync({ file: selection.file, attempt })
      if (attempt !== latestAttemptRef.current) {
        return
      }
      if (!response || response.status === VerifyTokenFactoryImageResponse_Status.APPROVED) {
        updateCreateNewTokenField('imageUrl', `ipfs://${cid}`)
        setStatus('success')
        scheduleClearLocalWhenGatewayImageReady({ store, cid, objectUrl, attempt, latestAttemptRef })
      } else {
        setStatus('error')
        setErrorReason('rejected')
        clearLocalImagePreview(store)
      }
    } catch {
      if (attempt !== latestAttemptRef.current) {
        return
      }
      setStatus('error')
      setErrorReason('upload-failed')
      clearLocalImagePreview(store)
    }
  }, [mutateAsync, store, updateCreateNewTokenField])

  const start = useCallback((): void => {
    runFlow().catch(() => undefined)
  }, [runFlow])

  return { status, errorReason, previewUri, start }
}
