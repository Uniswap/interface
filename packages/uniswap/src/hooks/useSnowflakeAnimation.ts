import { useCallback, useEffect, useRef, useState } from 'react'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Snowflake Animation Constants
 * These values control the realistic physics and appearance of falling snowflakes
 */

// Size distribution: Controls how often large vs small snowflakes appear
// Lower value = more small snowflakes (realistic, since real snow has mostly small flakes)
// Value of 0.06 creates ~60% small, ~25% medium, ~15% large flakes
const LARGE_SNOWFLAKE_FACTOR = 0.06

interface SnowflakeProps {
  id: number // Unique identifier for animation tracking
  size: number // Size in pixels (8-18px range)
  opacity: number // Transparency (0-1), correlated with size for depth
  blur: number // Blur amount in pixels, simulates distance (farther = more blur)
  left: number // Horizontal position as percentage (0-100%)
  duration: number // Fall duration in seconds, correlated with size
  drift: number // Horizontal drift in pixels for wind effect
  rotationSpeed: number // Rotation speed in degrees per second
  rotationDirection: 1 | -1 // Rotation direction: 1=clockwise, -1=counterclockwise
  startY: number // Starting Y position (negative = above visible area)
}

// Visual appearance ranges
const MIN_SIZE = 8 // Smallest snowflake size in pixels
const MAX_SIZE = 18 // Largest snowflake size in pixels
const MIN_OPACITY = 0.6 // Minimum opacity for distant/small flakes
const MAX_OPACITY = 1 // Maximum opacity for close/large flakes
const MIN_BLUR = 1.5 // Maximum blur for small/distant flakes (inverted)
const MAX_BLUR = 0 // No blur for large/close flakes

// Rotation physics: Smaller flakes tumble faster (less mass, more air resistance)
const MIN_ROTATION = 90 // Slower rotation for large flakes (degrees/second)
const MAX_ROTATION = 189 // Faster rotation for small flakes (degrees/second)

// Fall speed physics: Larger flakes fall faster (closer to camera, more mass)
const MIN_DURATION = 3.625 // Fastest fall time for large flakes (seconds)
const MAX_DURATION = 8 // Slowest fall time for small flakes (seconds)

// Continuous spawning intervals: Random timing eliminates "wave" effect
const MIN_SPAWN_INTERVAL = 150 // Minimum time between spawns (milliseconds)
const MAX_SPAWN_INTERVAL = 400 // Maximum time between spawns (milliseconds)

/**
 * Generate a weighted random snowflake size favoring smaller flakes
 * Uses power distribution to create realistic size distribution
 * @param largeFactor - Controls size distribution (lower = more small flakes)
 * @returns Size in pixels between MIN_SIZE and MAX_SIZE
 */
const generateSnowflakeSize = (largeFactor: number): number => {
  const random = Math.random()
  // Power function creates non-linear distribution favoring smaller values
  const weighted = Math.pow(random, 1 / (1 + largeFactor))
  return MIN_SIZE + weighted * (MAX_SIZE - MIN_SIZE)
}

/**
 * Calculate visual properties correlated with size for depth perception
 * Larger flakes appear closer (more opaque, less blur)
 * Smaller flakes appear farther (more transparent, more blur)
 * @param size - Snowflake size in pixels
 * @returns Opacity and blur values
 */
const getSnowflakeProps = (size: number): { opacity: number; blur: number } => {
  // Normalize size to 0-1 range
  const sizeRatio = (size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)
  return {
    // Larger flakes = more opaque (closer to viewer)
    opacity: MIN_OPACITY + sizeRatio * (MAX_OPACITY - MIN_OPACITY),
    // Larger flakes = less blur (closer to viewer, inverted scale)
    blur: MIN_BLUR - sizeRatio * (MIN_BLUR - MAX_BLUR),
  }
}

/**
 * Calculate rotation properties based on size with realistic physics
 * Smaller snowflakes tumble faster due to less mass and more air resistance
 * @param size - Snowflake size in pixels
 * @returns Rotation speed and direction
 */
const getRotationProps = (size: number): { rotationSpeed: number; rotationDirection: 1 | -1 } => {
  // Normalize size to 0-1 range
  const sizeRatio = (size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)
  // Inverse correlation: smaller flakes (low sizeRatio) get faster rotation
  const baseRotationSpeed = MAX_ROTATION - sizeRatio * (MAX_ROTATION - MIN_ROTATION)
  // Add ±30% random variation so each snowflake rotates uniquely
  const randomVariation = 0.7 + Math.random() * 0.6 // 0.7x to 1.3x multiplier
  const rotationSpeed = baseRotationSpeed * randomVariation
  // Randomly choose clockwise or counterclockwise rotation (50/50)
  const rotationDirection = Math.random() > 0.5 ? 1 : -1
  return { rotationSpeed, rotationDirection: rotationDirection as 1 | -1 }
}

/**
 * Calculate fall duration based on size for realistic depth perception
 * Larger flakes fall faster (appear closer), smaller flakes fall slower (appear farther)
 * This parallax effect enhances the 3D feeling
 * @param size - Snowflake size in pixels
 * @param speedFactor - Speed multiplier (1.0 = normal, 0.5 = half speed/double duration)
 * @returns Fall duration in seconds
 */
const getDuration = (size: number, speedFactor = 1.0): number => {
  // Normalize size to 0-1 range
  const sizeRatio = (size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)
  // Inverse correlation: larger flakes (high sizeRatio) fall faster (shorter duration)
  const baseDuration = MAX_DURATION - sizeRatio * (MAX_DURATION - MIN_DURATION)
  // Add ±10% random variation for natural, non-uniform motion
  const randomVariation = 0.9 + Math.random() * 0.2 // 0.9x to 1.1x multiplier
  // Apply speed factor: lower speed factor = longer duration (slower fall)
  return (baseDuration * randomVariation) / speedFactor
}

interface MouseInteractionConfig {
  /** Enable mouse interaction physics */
  enabled: boolean
  /** Container width in pixels */
  containerWidth: number
  /** Banner/Parent container height in pixels */
  bannerHeight?: number
}

interface MouseInteractionResult {
  /** Current mouse position relative to container */
  mousePosition: { x: number; y: number } | null
  /** Mouse move event handler */
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  /** Mouse leave event handler */
  handleMouseLeave: () => void
  /** Get accumulated drift for a snowflake */
  getSnowflakeDrift: (flakeId: number) => { x: number; y: number }
}

/**
 * Hook for realistic snowfall animation with physics-based motion
 * Creates continuous snowfall with varied sizes, speeds, rotation, and depth
 * @param mouseInteraction - Optional mouse interaction configuration
 * @param speedFactor - Speed multiplier for snowfall (1.0 = normal, 0.5 = half speed)
 * @returns Array of active snowflakes, removal function, and optional mouse interaction handlers
 */
export function useSnowflakeAnimation(
  mouseInteraction?: MouseInteractionConfig,
  speedFactor = 1.0,
): {
  snowflakes: SnowflakeProps[]
  removeSnowflake: (id: number) => void
  mouseInteraction?: MouseInteractionResult
} {
  const [snowflakes, setSnowflakes] = useState<SnowflakeProps[]>([])
  const [nextId, setNextId] = useState(0)
  const { fullWidth } = useDeviceDimensions()

  // Mouse interaction state (only used if enabled)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [mouseVelocity, setMouseVelocity] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const snowflakeDriftRef = useRef<Map<number, { vx: number; vy: number }>>(new Map())
  const snowflakeStartTimeRef = useRef<Map<number, number>>(new Map())
  const [, forceUpdate] = useState(0)

  // Callback to remove snowflakes after they complete their animation
  const removeSnowflake = useEvent((id: number) => {
    setSnowflakes((prev) => prev.filter((s) => s.id !== id))
  })

  // Mouse interaction handlers
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (!mouseInteraction?.enabled) {
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()
      const newPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      // Calculate velocity if we have a previous position
      if (mousePosition) {
        const vx = newPosition.x - mousePosition.x
        const vy = newPosition.y - mousePosition.y
        // Apply smoothing to velocity for more natural movement
        setMouseVelocity({
          x: vx * 0.7 + mouseVelocity.x * 0.3,
          y: vy * 0.7 + mouseVelocity.y * 0.3,
        })
      }

      setMousePosition(newPosition)
    },
    [mouseInteraction?.enabled, mousePosition, mouseVelocity],
  )

  const handleMouseLeave = useCallback((): void => {
    if (!mouseInteraction?.enabled) {
      return
    }
    setMousePosition(null)
    setMouseVelocity({ x: 0, y: 0 })
  }, [mouseInteraction?.enabled])

  const getSnowflakeDrift = useCallback((flakeId: number): { x: number; y: number } => {
    const drift = snowflakeDriftRef.current.get(flakeId)
    if (!drift) {
      return { x: 0, y: 0 }
    }
    return { x: drift.vx, y: drift.vy }
  }, [])

  // Clean up drift data for removed snowflakes
  useEffect(() => {
    if (!mouseInteraction?.enabled) {
      return
    }

    const currentIds = new Set(snowflakes.map((f) => f.id))
    const driftMap = snowflakeDriftRef.current
    const startTimeMap = snowflakeStartTimeRef.current
    const now = performance.now()

    // Initialize start time for new snowflakes
    snowflakes.forEach((flake) => {
      if (!startTimeMap.has(flake.id)) {
        startTimeMap.set(flake.id, now)
      }
    })

    // Remove drift data and start times for snowflakes that no longer exist
    for (const id of driftMap.keys()) {
      if (!currentIds.has(id)) {
        driftMap.delete(id)
        startTimeMap.delete(id)
      }
    }
  }, [snowflakes, mouseInteraction?.enabled])

  /**
   * Calculate current Y position of a snowflake based on animation progress
   * @param flake - Snowflake data
   * @param currentTime - Current timestamp from performance.now()
   * @param bannerHeight - Height of the banner
   * @returns Current Y position in pixels
   */
  const calculateSnowflakeY = useCallback(
    ({
      flake,
      currentTime,
      bannerHeight,
    }: {
      flake: { id: number; startY: number; duration: number }
      currentTime: number
      bannerHeight: number
    }): number => {
      const startTime = snowflakeStartTimeRef.current.get(flake.id)
      if (!startTime) {
        return flake.startY
      }

      const elapsed = (currentTime - startTime) / 1000 // Convert to seconds
      const progress = Math.min(elapsed / flake.duration, 1) // Clamp to [0, 1]

      // Calculate fall distance (same as animation keyframes)
      const buffer = 20
      const fallDistance = bannerHeight - flake.startY + buffer

      // Interpolate Y position
      return flake.startY + fallDistance * progress
    },
    [],
  )

  // Physics update loop: apply forces and decay momentum
  useEffect(() => {
    if (!mouseInteraction?.enabled) {
      return
    }

    let animationFrameId: number

    const updatePhysics = (): void => {
      // Skip physics updates when mouse is idle or absent
      if (!mousePosition || (Math.abs(mouseVelocity.x) < 0.1 && Math.abs(mouseVelocity.y) < 0.1)) {
        animationFrameId = requestAnimationFrame(updatePhysics)
        return
      }
      const driftMap = snowflakeDriftRef.current
      const currentTime = performance.now()

      snowflakes.forEach((flake) => {
        // Get or initialize drift velocity for this snowflake
        let drift = driftMap.get(flake.id)
        if (!drift) {
          drift = { vx: 0, vy: 0 }
          driftMap.set(flake.id, drift)
        }

        // Apply breeze force if mouse is near and moving
        if (mouseInteraction.containerWidth) {
          const flakeX = (flake.left / 100) * mouseInteraction.containerWidth
          const flakeY = calculateSnowflakeY({ flake, currentTime, bannerHeight: mouseInteraction.bannerHeight ?? 56 })
          const dx = flakeX - mousePosition.x
          const dy = flakeY - mousePosition.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          const wakeRadius = 120
          if (distance < wakeRadius) {
            const influenceFactor = Math.pow(1 - distance / wakeRadius, 2)
            const cursorSpeed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y)

            if (cursorSpeed > 2) {
              // Apply force in direction of cursor movement
              const forceMultiplier = 0.8 // How quickly force accumulates
              drift.vx += mouseVelocity.x * influenceFactor * forceMultiplier
              drift.vy += mouseVelocity.y * influenceFactor * forceMultiplier * 0.3 // Weaker vertical
            }
          }
        }

        // Apply decay (friction) - momentum gradually fades
        const decay = 0.92 // Lower = faster decay
        drift.vx *= decay
        drift.vy *= decay

        // Stop very small drifts to prevent floating point accumulation
        if (Math.abs(drift.vx) < 0.01) {
          drift.vx = 0
        }
        if (Math.abs(drift.vy) < 0.01) {
          drift.vy = 0
        }

        // Cap maximum drift velocity
        const maxVelocity = 60
        const currentSpeed = Math.sqrt(drift.vx * drift.vx + drift.vy * drift.vy)
        if (currentSpeed > maxVelocity) {
          const scale = maxVelocity / currentSpeed
          drift.vx *= scale
          drift.vy *= scale
        }
      })

      // Trigger re-render to update positions
      forceUpdate((n) => n + 1)

      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)

    // return a cleanup function to correctly cancel the animation frame on a mouse movement
    // eslint-disable-next-line consistent-return
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [snowflakes, mousePosition, mouseVelocity, mouseInteraction, calculateSnowflakeY])

  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't want to add nextId to the dependencies which get constantly updated when snowflakes are spawned/removed causing poor performance
  const spawnSnowflakes = useCallback(() => {
    // Calculate spawn amount to maintain high density with continuous spawning
    // Strategy: Spawn small groups frequently instead of large batches infrequently
    const maxSnowflakeFactor = 60 // Density factor (lower = more snowflakes)
    const maxSnowflakes = Math.floor(Math.max(fullWidth, 780) / maxSnowflakeFactor)
    const averageSpawnInterval = (MIN_SPAWN_INTERVAL + MAX_SPAWN_INTERVAL) / 2 // ~275ms average
    const oldBatchInterval = 1500 // Previous batch spawn interval for reference
    const spawnsPerOldBatch = oldBatchInterval / averageSpawnInterval // ~5.45 spawns in old cycle

    // Calculate how many to spawn per interval
    const basePerSpawn = maxSnowflakes / spawnsPerOldBatch
    const random = Math.random()
    const multiplier = 0.7 + random * 0.3 // Random variation (70-100% of base)
    // Multiply by 5.85 for extremely dense, immersive snowfall (30% increase from 4.5)
    const numToSpawn = Math.max(2, Math.floor(basePerSpawn * multiplier * 5.85))

    // Generate new snowflakes with randomized physics properties
    const newSnowflakes: SnowflakeProps[] = []
    for (let i = 0; i < numToSpawn; i++) {
      // Generate correlated properties for realistic depth perception
      const size = generateSnowflakeSize(LARGE_SNOWFLAKE_FACTOR)
      const { opacity, blur } = getSnowflakeProps(size) // Visual depth cues
      const { rotationSpeed, rotationDirection } = getRotationProps(size) // Tumbling physics
      const duration = getDuration(size, speedFactor) // Fall speed based on size/distance

      const snowflakeId = nextId + i

      // Horizontal drift: Simulates gentle wind (±1% of screen width)
      const driftDegree = fullWidth / 100
      const drift = Math.random() * (driftDegree * 2) - driftDegree

      // Random starting Y position: Prevents all snowflakes appearing on same line
      // Range: -20px to -40px (above visible area)
      const startY = -20 - Math.random() * 20

      newSnowflakes.push({
        id: snowflakeId,
        size,
        opacity,
        blur,
        left: Math.random() * 100, // Random horizontal position (0-100% of parent width)
        duration,
        drift,
        rotationSpeed,
        rotationDirection,
        startY,
      })
    }

    // Merge new snowflakes with existing ones (prevents duplicates)
    setSnowflakes((prev) => {
      const snowflakeMap = new Map<number, SnowflakeProps>()
      // Add existing snowflakes
      prev.forEach((flake) => {
        snowflakeMap.set(flake.id, flake)
      })
      // Add new snowflakes (only if ID doesn't exist)
      newSnowflakes.forEach((flake) => {
        if (!snowflakeMap.has(flake.id)) {
          snowflakeMap.set(flake.id, flake)
        }
      })

      return Array.from(snowflakeMap.values())
    })
    setNextId((prev) => prev + numToSpawn)
  }, [fullWidth, speedFactor])

  // Set up continuous spawning with random intervals
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to start continuous spawning once
  useEffect(() => {
    let isActive = true
    let timeoutId: NodeJS.Timeout

    /**
     * Recursive function that spawns snowflakes and schedules the next spawn
     * Uses random intervals (150-400ms) to create natural, continuous flow
     * Eliminates "wave" effect of batch spawning
     */
    const scheduleNextSpawn = (): void => {
      if (!isActive) {
        return
      }

      spawnSnowflakes()

      // Schedule next spawn at random interval for natural variation
      const nextInterval = MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL)
      timeoutId = setTimeout(scheduleNextSpawn, nextInterval)
    }

    // Start continuous spawning after initial delay
    const startTimer = setTimeout(() => {
      scheduleNextSpawn()
    }, 900)

    // Cleanup: Stop spawning when component unmounts
    return () => {
      isActive = false
      clearTimeout(startTimer)
      clearTimeout(timeoutId)
    }
  }, [])

  return {
    snowflakes,
    removeSnowflake,
    ...(mouseInteraction?.enabled && {
      mouseInteraction: {
        mousePosition,
        handleMouseMove,
        handleMouseLeave,
        getSnowflakeDrift,
      },
    }),
  }
}
