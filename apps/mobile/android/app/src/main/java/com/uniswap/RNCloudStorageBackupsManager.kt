package com.uniswap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.gson.Gson
import decrypt
import encrypt
import generateSalt
import generateNonce
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.FileNotFoundException
import java.util.Date
import javax.crypto.BadPaddingException
import javax.crypto.IllegalBlockSizeException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import java.util.Collections

/**
 * Data class representing a mnemonic backup in cloud storage.
 *
 * @property mnemonicId The ID of the mnemonic string.
 * @property encryptedMnemonic The encrypted mnemonic string.
 * @property encryptionSalt The salt used for generating the encryption key from password.
 * @property encryptionNonce The nonce used for encryption.
 * @property createdAt The time the backup was created, in seconds since the epoch.
 */
data class CloudStorageMnemonicBackup(
  val mnemonicId: String,
  val encryptedMnemonic: String,
  val encryptionSalt: String,
  val encryptionNonce: ByteArray,
  val createdAt: Double,
  val googleDriveEmail: String? = null
)

/**
 * Enum representing various types of cloud backup errors.
 */
enum class CloudBackupError(val value: String) {
  BACKUP_NOT_FOUND_ERROR("backupNotFoundError"),
  BACKUP_ENCRYPTION_ERROR("backupEncryptionError"),
  BACKUP_DECRYPTION_ERROR("backupDecryptionError"),
  BACKUP_INCORRECT_PASSWORD_ERROR("backupIncorrectPasswordError"),
  DELETE_BACKUP_ERROR("deleteBackupError"),
  CLOUD_ERROR("cloudError")
}

/**
 * Enum representing various types of requests.
 */
enum class Request(val value: Int) {
  GOOGLE_SIGN_IN(122)
}

/**
 * Class for managing cloud storage backups on android for React Native.
 *
 * @property reactContext The react application context.
 */
class RNCloudStorageBackupsManager(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "RNCloudStorageBackupsManager"

  private val rnEthersRS = RnEthersRs(reactContext)

  private val gson = Gson()

  /**
   * Checks if cloud storage services (like Google Play Services) are available.
   * There is no way to check if just google drive api is available
   *
   * @param promise A promise to return the result of the operation.
   */
  @ReactMethod
  fun isCloudStorageAvailable(promise: Promise) {
    val googleApiAvailability = GoogleApiAvailability.getInstance()
    val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(reactContext)
    promise.resolve(resultCode == ConnectionResult.SUCCESS)
  }

  /**
   * Fetches list of backups and returns it by resolving a promise promise.
   *
   * @param promise A promise to return the result of the operation.
   */
  @ReactMethod
  fun getCloudBackupList(promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        GoogleDriveApiHelper.getGoogleDrive(reactContext).let { (drive) ->
          if (drive == null) return@launch
          GoogleDriveApiHelper.fetchCloudBackupFiles(drive).let { files ->
            val backupDeferreds = files.files.map { file ->
              async(Dispatchers.IO) {
                val outputStream = ByteArrayOutputStream()
                drive.files()[file.id]
                  .executeMediaAndDownloadTo(outputStream)
                val mnemonicBackup: CloudStorageMnemonicBackup = gson.fromJson(outputStream.toString(), CloudStorageMnemonicBackup::class.java)
                
                val backup: WritableMap = Arguments.createMap()
                backup.putString("mnemonicId", mnemonicBackup.mnemonicId)
                backup.putString("createdAt", mnemonicBackup.createdAt.toString())
                backup.putString("googleDriveEmail", mnemonicBackup.googleDriveEmail)
                
                backup
              }
            }
            
            val backups = backupDeferreds.awaitAll()
            
            val resultArray: WritableArray = Arguments.createArray()
            backups.forEach { resultArray.pushMap(it) }
            promise.resolve(resultArray)
          }
        }
      } catch (e: Exception) {
        promise.reject(CloudBackupError.CLOUD_ERROR.value, "Failed to fetch cloud backups")
      }
    }
  }

  /**
   * Backs up a mnemonic string as a json file with mnemonicId as a name to google drive api.
   * Backup is stored in app specific folder which is not accessible to other apps.
   *
   * @param mnemonicId The ID of the mnemonic string.
   * @param password The password used for encryption.
   * @param promise A promise to return the result of the operation.
   */
  @ReactMethod
  fun backupMnemonicToCloudStorage(mnemonicId: String, password: String, promise: Promise) {
    CoroutineScope(Dispatchers.Default).launch {
      try {
        val mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId)
          ?: throw Exception("rnEthersRs module retrieve mnemonic null")
        val encryptionSalt = generateSalt(16)
        val encryptionNonce = generateNonce(12)
        val encryptedMnemonic =
          withContext(Dispatchers.IO) { encrypt(mnemonic, password, encryptionSalt, encryptionNonce) }
        GoogleDriveApiHelper.getGoogleDrive(reactContext).let { (drive, acc) ->
          if (drive == null) return@launch
          val createdAt = Date().time / 1000.0
          val backup = CloudStorageMnemonicBackup(
            mnemonicId,
            encryptedMnemonic,
            encryptionSalt,
            encryptionNonce,
            createdAt,
            acc?.email
          )
          withContext(Dispatchers.IO) {
            GoogleDriveApiHelper.saveMnemonicToGoogleDrive(drive, mnemonicId, backup)
          }
        }
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(
          CloudBackupError.BACKUP_ENCRYPTION_ERROR.value,
          "Failed to encrypt mnemonics: ${e.message}",
          e,
        )
      }
    }
  }

  /**
   * Restores a mnemonic string from a backup in google drive.
   *
   * @param mnemonicId The ID of the mnemonic string.
   * @param password The password used for decryption.
   * @param promise A promise to return the result of the operation.
   */
  @ReactMethod
  fun restoreMnemonicFromCloudStorage(mnemonicId: String, password: String, promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        GoogleDriveApiHelper.getGoogleDrive(reactContext, true).let { (drive) ->
          if (drive == null) return@launch
          val fileId = withContext(Dispatchers.IO) {
            GoogleDriveApiHelper.getFileIdByFileName(
              drive,
              mnemonicId
            )
          }
          if (fileId == null) {
            promise.reject(
              CloudBackupError.BACKUP_NOT_FOUND_ERROR.value,
              "The file $mnemonicId is not found in Google Drive"
            )
          }
          val outputStream = ByteArrayOutputStream()
          withContext(Dispatchers.IO) {
            drive.files().get(fileId).executeMediaAndDownloadTo(outputStream)
          }
          var mnemonicsBackup: CloudStorageMnemonicBackup?
          var decryptedMnemonics: String? = null

          withContext(Dispatchers.IO) {
            mnemonicsBackup =
              gson.fromJson(outputStream.toString(), CloudStorageMnemonicBackup::class.java)
          }

          val encryptedMnemonic = mnemonicsBackup?.encryptedMnemonic
          val encryptionSalt = mnemonicsBackup?.encryptionSalt
          val encryptionNonce = mnemonicsBackup?.encryptionNonce

          if (encryptedMnemonic == null || encryptionSalt == null || encryptionNonce == null) throw Exception("Failed to read mnemonics backup")

          try {
            decryptedMnemonics = withContext(Dispatchers.IO) {
              decrypt(encryptedMnemonic, password, encryptionSalt, encryptionNonce)
            }
          } catch (e: BadPaddingException) {
            Log.e("EXCEPTION", "${e.message}")
            promise.reject(
              CloudBackupError.BACKUP_INCORRECT_PASSWORD_ERROR.value,
              "Incorrect decryption password"
            )
          } catch (e: IllegalBlockSizeException) {
            Log.e("EXCEPTION", "${e.message}")
            promise.reject(
              CloudBackupError.BACKUP_DECRYPTION_ERROR.value,
              "Incorrect decryption password"
            )
          } catch (e: Exception) {
            Log.e("EXCEPTION", "${e.message}")
            promise.reject(
              CloudBackupError.BACKUP_DECRYPTION_ERROR.value,
              "Failed to decrypt mnemonics"
            )
          }

          rnEthersRS.storeNewMnemonic(mnemonic = decryptedMnemonics, address = mnemonicId)
          promise.resolve(true)
        }
      } catch (e: Exception) {
        Log.e("EXCEPTION", "${e.message}")
        promise.reject(
          CloudBackupError.BACKUP_NOT_FOUND_ERROR.value,
          "Backup file not found in local storage"
        )
      }
    }
  }

  /**
   * Deletes a mnemonic backup from google drive.
   *
   * @param mnemonicId The ID of the mnemonic backup.
   * @param promise A promise to return the result of the operation.
   */
  @ReactMethod
  fun deleteCloudStorageMnemonicBackup(mnemonicId: String, promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        GoogleDriveApiHelper.getGoogleDrive(reactContext, true).let { (drive) ->
          if (drive == null) return@launch
          withContext(Dispatchers.IO) {
            val fileId = GoogleDriveApiHelper.getFileIdByFileName(drive, mnemonicId)
            if (fileId == null) {
              GoogleDriveApiHelper.getGoogleDrive(reactContext).let { (drive) ->
                if (drive == null) return@let
                val fileId = GoogleDriveApiHelper.getFileIdByFileName(drive, mnemonicId)
                  ?: throw FileNotFoundException("Failed to locate backup")
                drive.files().delete(fileId).execute()
              }
            } else {
              drive.files().delete(fileId).execute()
            }
          }
        }
        promise.resolve(true)
      } catch (e: FileNotFoundException) {
        Log.e("EXCEPTION", "${e.message}")
        promise.reject(CloudBackupError.DELETE_BACKUP_ERROR.value, "Failed to locate backup")
      } catch (e: Exception) {
        Log.e("EXCEPTION", "${e.message}")
        promise.reject(CloudBackupError.DELETE_BACKUP_ERROR.value, "Failed to delete backup")
      }
    }
  }
}
