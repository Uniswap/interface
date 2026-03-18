import Foundation
import CommonCrypto
import NitroModules

/**
 * Native hashcash proof-of-work solver for iOS.
 *
 * Uses CommonCrypto for SHA256 hashing. The computation runs on a
 * background thread via Nitro's Promise.async to avoid blocking
 * the main/JS thread.
 *
 * Performance notes:
 * - Cancellation is checked every 1000 iterations to balance responsiveness
 *   with cancellation check overhead
 * - NSLock provides thread-safe access to the cancellation flag
 *   (Swift's standard pattern for thread-safe booleans, equivalent to
 *   Java's AtomicBoolean pattern)
 * - Native CommonCrypto is significantly faster than JS crypto
 */
class HybridHashcash: HybridHashcashSpec {
    /// Thread-safe cancellation flag. Checked every 1000 iterations
    /// to allow responsive cancellation without excessive overhead.
    private var cancelled = false

    /// NSLock for thread-safe cancellation flag access.
    /// Swift's standard pattern for synchronizing access to shared state.
    private let lock = NSLock()

    private var isCancelled: Bool {
        lock.lock()
        defer { lock.unlock() }
        return cancelled
    }

    private func setCancelled(_ value: Bool) {
        lock.lock()
        defer { lock.unlock() }
        cancelled = value
    }

    /**
     * Find a proof-of-work solution for the given challenge.
     *
     * Iterates through counter values computing SHA256 hashes until
     * one is found with the required number of leading zero bytes.
     */
    func findProof(params: FindProofParams) throws -> Promise<HashcashProofResult?> {
        return Promise.async { [weak self] in
            guard let self = self else { return nil }

            self.setCancelled(false)

            let challenge = params.challenge
            let rangeStart = Int(params.rangeStart ?? 0)
            let rangeSize = Int(params.rangeSize ?? challenge.maxProofLength)
            let rangeEnd = rangeStart + rangeSize

            let startTime = CFAbsoluteTimeGetCurrent()

            for counter in rangeStart..<rangeEnd {
                // Check cancellation every 1000 iterations
                if counter % 1000 == 0 && self.isCancelled {
                    return nil
                }

                // Compute hash for this counter
                let hash = self.computeHash(
                    subject: challenge.subject,
                    nonce: challenge.nonce,
                    counter: counter
                )

                // Check if hash meets difficulty requirement
                if self.checkDifficulty(hash: hash, difficulty: Int(challenge.difficulty)) {
                    let timeMs = (CFAbsoluteTimeGetCurrent() - startTime) * 1000

                    return HashcashProofResult(
                        counter: String(counter),
                        hashBase64: hash.base64EncodedString(),
                        attempts: Double(counter - rangeStart + 1),
                        timeMs: timeMs
                    )
                }
            }

            return nil
        }
    }

    /**
     * Cancel any in-progress proof search.
     */
    func cancel() throws {
        setCancelled(true)
    }

    // MARK: - Private Helpers

    /**
     * Compute SHA256 hash of "{subject}:{nonce}:{counter}"
     */
    private func computeHash(subject: String, nonce: String, counter: Int) -> Data {
        let solutionString = "\(subject):\(nonce):\(counter)"
        guard let data = solutionString.data(using: .utf8) else {
            return Data()
        }

        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { bytes in
            _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &hash)
        }

        return Data(hash)
    }

    /**
     * Check if hash has required number of leading zero bytes.
     *
     * difficulty=1 means first byte must be 0x00
     * difficulty=2 means first two bytes must be 0x00, etc.
     */
    private func checkDifficulty(hash: Data, difficulty: Int) -> Bool {
        guard hash.count >= difficulty else { return false }

        for i in 0..<difficulty {
            if hash[i] != 0 {
                return false
            }
        }

        return true
    }
}
