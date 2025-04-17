import com.lambdapioneer.argon2kt.Argon2Kt
import com.lambdapioneer.argon2kt.Argon2KtResult
import com.lambdapioneer.argon2kt.Argon2Mode
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom
import android.util.Base64;
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.spec.MGF1ParameterSpec
import java.security.spec.RSAKeyGenParameterSpec
import java.math.BigInteger

/**
 * Encrypts a string using an AES/GCM cipher and a key derived from a password and salt.
 *
 * This function creates a key from a password and salt with the function [keyFromPassword].
 * It then creates a Cipher instance for AES/GCM/NoPadding with a given random nonce and
 * encrypts the original string. The result of this operation is encoded as Base64 and
 * then returned.
 *
 * @param secret The original plaintext string to be encrypted.
 * @param password The user-supplied password used for generating the encryption key with the salt.
 * @param salt The unique salt used in conjunction with the password for key generation.
 * @param nonce The unique byte array nonce (IV) used for AES-GCM cipher
 *
 * @return A string representing the Base64 encoded encrypted string.
 *
 * @throws IllegalArgumentException If secret, password, salt, or nonce is blank.
 *
 * @see Cipher
 * @see SecretKeySpec
 * @see IvParameterSpec
 * @see Base64
 */
fun encrypt(secret: String, password: String, salt: String, nonce: ByteArray): String {
    val key = keyFromPassword(password, salt)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(nonce))
    val encrypted = cipher.doFinal(secret.toByteArray(Charsets.UTF_8))
    return Base64.encodeToString(encrypted, Base64.DEFAULT)
}

/**
 * Decrypts an AES/GCM encrypted string using a password, salt, and nonce to provide the decryption key.
 *
 * This function generates a key derived from a password and salt, along with the nonce used for AES-GCM cipher
 * This key is then used in an AES/GCM cipher to decrypt the provided encrypted secret. Returns the decrypted
 * original string.
 *
 * @param encryptedSecret The encrypted string (in Base64 format) to be decrypted.
 * @param password User-supplied password used along with salt for deriving the decryption key.
 * @param salt A unique string (in Base64 format) used to diversify derived encryption keys
 *             and to protect from rainbow table attacks.
 * @param nonce A unique byte array used as an nonce/IV for the AES-GCM cipher.
 *
 * @return A UTF-8 encoded string that was decrypted from the encryptedSecret.
 *
 * @throws IllegalArgumentException If password or salt or nonce is blank or encryptedSecret is not a valid Base64 string.
 *
 * @see Cipher
 * @see SecretKeySpec
 * @see IvParameterSpec
 * @see Base64
 * @see Charsets.UTF_8
 */
fun decrypt(encryptedSecret: String, password: String, salt: String, nonce: ByteArray): String {
    val key = keyFromPassword(password, salt)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(nonce))
    val original = cipher.doFinal(Base64.decode(encryptedSecret, Base64.DEFAULT))
    return String(original, Charsets.UTF_8)
}

/**
 * Generates a cryptographic key from a user password and salt using Argon2Kt.
 *
 * This function uses Argon2Kt to generate a hash from a user password and a given salt.
 * It then returns the raw hash as a byte array.
 * This is useful for secure password storage or key derivation.
 * Parameters where picked based on the security audit and recommendations
 *
 * @param password The plaintext password provided by the user.
 * @param salt The unique salt generated for hashing.
 *
 * @return A byte array representing the raw hash of the password.
 *
 * @throws IllegalArgumentException If password or salt is blank.
 *
 * @see Argon2Kt
 * @see Charsets
 */
fun keyFromPassword(password: String, salt: String): ByteArray {
    val hash: Argon2KtResult = Argon2Kt().hash(
      mode = Argon2Mode.ARGON2_ID,
      password = password.toByteArray(Charsets.UTF_8),
      salt = salt.toByteArray(Charsets.UTF_8),
      tCostInIterations = 3,
      mCostInKibibyte = 65536,
      parallelism = 4
    )
    return hash.rawHashAsByteArray()
}

/**
 * Generates a Base64-encoded string to be used as a security salt.
 *
 * This function creates a ByteArray of a given length and populates it
 * with securely random bytes. These bytes are then encoded to Base64 string.
 *
 * @param length The length of the byte array to be generated which further determines the length of the salt.
 *
 * @return A Base64 encoded string representing the generated salt.
 *
 * @see SecureRandom
 * @see Base64
 */
fun generateSalt(length: Int): String {
    val bytes = ByteArray(length)
    val secureRandom = SecureRandom()
    secureRandom.nextBytes(bytes)
    return Base64.encodeToString(bytes, Base64.DEFAULT)
}

/**
 * Generates a byte array to be used as a nonce/initialization vector.
 *
 * This function creates a ByteArray of a given length and populates it
 * with securely random bytes.
 *
 * @param length The length of the byte array to be generated.
 *
 * @return A random array of bytes representing the generated nonce.
 *
 * @see SecureRandom
 * @see Base64
 */
fun generateNonce(length: Int): ByteArray {
    val bytes = ByteArray(length)
    val secureRandom = SecureRandom()
    secureRandom.nextBytes(bytes)
    return bytes
}

/**
 * Generates an RSA key pair for encrypting/decrypting seed phrases.
 * Matches the web implementation using RSA-OAEP with SHA-256.
 *
 * @return A Pair containing the Base64 encoded public key in SPKI format (first)
 *         and the KeyPair object (second) for later decryption
 */
fun generateRsaKeyPair(): Pair<String, KeyPair> {
    val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
    val parameterSpec = RSAKeyGenParameterSpec(
        2048, // modulusLength
        BigInteger.valueOf(65537) // publicExponent (same as [1, 0, 1] in web)
    )

    keyPairGenerator.initialize(parameterSpec)
    val keyPair = keyPairGenerator.generateKeyPair()

    // Export public key in SPKI
    val publicKeyEncoded = keyPair.public.encoded
    val publicKeyBase64 = Base64.encodeToString(publicKeyEncoded, Base64.NO_WRAP)

    return Pair(publicKeyBase64, keyPair)
}

val oaepParams = OAEPParameterSpec(
    "SHA-256",  // digest algorithm
    "MGF1",     // mask generation function
    MGF1ParameterSpec.SHA256,  // MGF digest
    PSource.PSpecified.DEFAULT  // source of encoding input
)

/**
 * Decrypts an encrypted seed phrase response using an RSA key pair.
 */
fun decryptMnemonic(encryptedMnemonic: String, keyPair: KeyPair): String {
    val cipher = Cipher.getInstance("RSA/None/OAEPPadding")
    cipher.init(Cipher.DECRYPT_MODE, keyPair.private, oaepParams)

    val encryptedBytes = Base64.decode(encryptedMnemonic, Base64.DEFAULT)
    val decryptedBytes = cipher.doFinal(encryptedBytes)
    return String(decryptedBytes, Charsets.UTF_8)
}
