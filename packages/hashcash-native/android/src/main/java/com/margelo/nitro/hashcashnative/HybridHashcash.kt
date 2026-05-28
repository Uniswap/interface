package com.margelo.nitro.hashcashnative

import com.margelo.nitro.core.Promise
import java.security.MessageDigest
import java.util.Base64
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Native hashcash proof-of-work solver for Android.
 *
 * Uses java.security.MessageDigest for SHA256 hashing. The computation
 * runs on a background thread via Nitro's Promise.async to avoid blocking
 * the main/JS thread.
 *
 * Performance notes:
 * - Cancellation is checked every 1000 iterations to balance responsiveness
 *   with cancellation check overhead
 * - AtomicBoolean provides thread-safe access to the cancellation flag
 * - Native MessageDigest is significantly faster than JS crypto
 */
class HybridHashcash : HybridHashcashSpec() {
    /**
     * Thread-safe cancellation flag using AtomicBoolean.
     * Checked every 1000 iterations to allow responsive cancellation
     * without excessive overhead.
     */
    private val cancelled = AtomicBoolean(false)

    /**
     * Find a proof-of-work solution for the given challenge.
     *
     * Iterates through counter values computing SHA256 hashes until
     * one is found with the required number of leading zero bytes.
     */
    override fun findProof(params: FindProofParams): Promise<HashcashProofResult?> {
        return Promise.async {
            cancelled.set(false)

            val challenge = params.challenge
            val rangeStart = params.rangeStart?.toInt() ?: 0
            val rangeSize = params.rangeSize?.toInt() ?: challenge.maxProofLength.toInt()
            val rangeEnd = rangeStart + rangeSize

            val startTime = System.currentTimeMillis()
            val digest = MessageDigest.getInstance("SHA-256")

            for (counter in rangeStart until rangeEnd) {
                // Check cancellation every 1000 iterations
                if (counter % 1000 == 0 && cancelled.get()) {
                    return@async null
                }

                // Compute hash for this counter
                val hash = computeHash(digest, challenge.subject, challenge.nonce, counter)

                // Check if hash meets difficulty requirement
                if (checkDifficulty(hash, challenge.difficulty.toInt())) {
                    val timeMs = (System.currentTimeMillis() - startTime).toDouble()

                    return@async HashcashProofResult(
                        counter = counter.toString(),
                        hashBase64 = Base64.getEncoder().encodeToString(hash),
                        attempts = (counter - rangeStart + 1).toDouble(),
                        timeMs = timeMs
                    )
                }
            }

            null
        }
    }

    /**
     * Cancel any in-progress proof search.
     */
    override fun cancel() {
        cancelled.set(true)
    }

    // MARK: - Private Helpers

    /**
     * Compute SHA256 hash of "{subject}:{nonce}:{counter}"
     */
    private fun computeHash(
        digest: MessageDigest,
        subject: String,
        nonce: String,
        counter: Int
    ): ByteArray {
        val solutionString = "$subject:$nonce:$counter"
        digest.reset()
        return digest.digest(solutionString.toByteArray(Charsets.UTF_8))
    }

    /**
     * Check if hash has required number of leading zero bytes.
     *
     * difficulty=1 means first byte must be 0x00
     * difficulty=2 means first two bytes must be 0x00, etc.
     */
    private fun checkDifficulty(hash: ByteArray, difficulty: Int): Boolean {
        if (hash.size < difficulty) return false

        for (i in 0 until difficulty) {
            if (hash[i] != 0.toByte()) {
                return false
            }
        }

        return true
    }
}
