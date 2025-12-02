// Cache for rotation styles to avoid recalculating for the same IDs
const rotationStyleCache = new Map<string, number>()

/**
 * Generates a unique rotation angle for an element based on its ID
 * Results are cached to avoid recalculating for the same ID
 * @param id - Unique identifier for the element
 * @returns Rotation value in degrees
 */
export function generateRotationStyle(id: string): number {
  // Check cache first
  if (rotationStyleCache.has(id)) {
    return rotationStyleCache.get(id)!
  }

  // Generate hash from ID
  const hashCode = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Determine rotation direction (positive or negative)
  const direction = hashCode % 2 === 0 ? 1 : -1

  // Generate rotation amount between 0.5 and 2.5 degrees
  const rotationAmount = 0.5 + (hashCode % 201) / 100 // Range: 0.5 to 2.5
  const rotation = direction * rotationAmount

  // Cache the result
  rotationStyleCache.set(id, rotation)

  return rotation
}
