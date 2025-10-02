// Shared image standards for avatar uploads across all platforms
export const AVATAR_IMAGE_STANDARDS = {
  maxWidth: 500,
  maxHeight: 500,
  quality: 1 as const, // best quality - typed as literal 1 for PhotoQuality compatibility
  maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
} as const
