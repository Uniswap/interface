import { ProfileMetadata } from '@universe/api/src/clients/unitags/types'

function isMissingValue(value: string | undefined): boolean {
  return value === undefined || value === ''
}

export function isFieldEdited(a: string | undefined, b: string | undefined): boolean {
  if (isMissingValue(a) && isMissingValue(b)) {
    return false
  }

  return a !== b
}

export function isProfileMetadataEdited({
  loading,
  updatedMetadata,
  initialMetadata,
}: {
  loading: boolean
  updatedMetadata: ProfileMetadata
  initialMetadata?: ProfileMetadata
}): boolean {
  return (
    !loading &&
    (isFieldEdited(initialMetadata?.avatar, updatedMetadata.avatar) ||
      isFieldEdited(initialMetadata?.description, updatedMetadata.description) ||
      isFieldEdited(initialMetadata?.twitter, updatedMetadata.twitter))
  )
}
