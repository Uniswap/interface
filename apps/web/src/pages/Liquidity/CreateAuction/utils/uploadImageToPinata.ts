/**
 * Uploads a file directly to a Pinata v3 signed upload URL (browser -> Pinata, not through our
 * backend) and returns the resulting IPFS CID.
 *
 * The signed URL already encodes the target group and network (enforced server-side), so we send
 * only the file under the `file` field and add no auth headers. Shape verified against the live
 * data-api flow: request is `multipart/form-data`, response is `{ data: { cid } }`.
 */
export async function uploadImageToPinata(signedUrl: string, file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch(signedUrl, { method: 'POST', body })
  if (!response.ok) {
    throw new Error(`Pinata upload failed with status ${response.status}`)
  }

  const json = (await response.json()) as { data?: { cid?: string } }
  const cid = json.data?.cid
  if (!cid) {
    throw new Error('Pinata upload response did not include a CID')
  }
  return cid
}
