package com.uniswap.onboarding.scantastic

import com.uniswap.RnEthersRs
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import java.security.spec.MGF1ParameterSpec
import java.math.BigInteger
import java.util.Base64
import java.security.KeyFactory
import java.security.spec.RSAPublicKeySpec
import javax.crypto.Cipher

class ScantasticError(override val message: String) : Exception(message)

class ScantasticEncryption(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "ScantasticEncryption"

    private val rnEthersRS = RnEthersRs(reactContext)

    @ReactMethod
    fun getEncryptedMnemonic(mnemonicId: String, n: String, e: String, promise: Promise) {
        val mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId) ?: run {
            promise.reject(ScantasticError("Failed to retrieve mnemonic"))
            return
        }

        val publicKey = try {
            generatePublicRSAKey(n, e)
        } catch (ex: Exception) {
            promise.reject(ScantasticError("Failed to generate public Key: ${ex.message}"))
            return
        }

        val encodedCiphertext = try {
            encryptForStorage(mnemonic, publicKey)
        } catch (ex: Exception) {
            promise.reject(ScantasticError("Failed to encrypt the mnemonic: ${ex.message}"))
            return
        }
        // Normal B64 not URL encoded, use getUrlDecoder() if you need URL encoded format
        val b64encodedCiphertext = Base64.getEncoder().encodeToString(encodedCiphertext)
        promise.resolve(b64encodedCiphertext)
    }

    @Throws(Exception::class)
    private fun generatePublicRSAKey(modulusStr: String, exponentStr: String): java.security.PublicKey {
        val modulus = BigInteger(1, base64UrlToStandardBase64(modulusStr).let { Base64.getDecoder().decode(it) })
        val exponent = BigInteger(1, base64UrlToStandardBase64(exponentStr).let { Base64.getDecoder().decode(it) })
        val keySpec = RSAPublicKeySpec(modulus, exponent)
        return KeyFactory.getInstance("RSA").generatePublic(keySpec)
    }

    // It is unclear why URLDecoder doesn't do this by default and we have to do it here instead.
    private fun base64UrlToStandardBase64(input: String): String {
        var base64 = input.replace("-", "+").replace("_", "/")
        while (base64.length % 4 != 0) {
            base64 += "="
        }
        return base64
    }

    @Throws(Exception::class)
    private fun encryptForStorage(plaintext: String, publicKey: java.security.PublicKey): ByteArray {
        val oaepParams = OAEPParameterSpec(
            "SHA-256",
            "MGF1",
            MGF1ParameterSpec.SHA256,
            PSource.PSpecified.DEFAULT
        )

        val cipher = Cipher.getInstance("RSA/ECB/OAEPPadding")
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaepParams)
        return cipher.doFinal(plaintext.toByteArray())
    }
}
