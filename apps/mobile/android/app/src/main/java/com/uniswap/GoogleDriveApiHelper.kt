package com.uniswap

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.ByteArrayContent
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import com.google.api.services.drive.model.File
import com.google.api.services.drive.model.FileList
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.nio.charset.StandardCharsets

object GDriveParams {
  const val SPACES = "appDataFolder"
  const val FIELDS = "nextPageToken, files(id, name)"
  const val PAGE_SIZE_NORMAL = 30
  const val ORDER_BY_NEWEST = "modifiedTime desc"
}

/**
 * Helper class for Google Drive operations such as fetching and storing backups.
 */
class GoogleDriveApiHelper {
  companion object {

    private val gson = Gson()

    /**
     * Returns a GoogleSignInClient object, which is needed to access Google Drive.
     *
     * @param reactContext The react application context.
     * @return GoogleSignInClient object
     * @throws IllegalStateException if the activity context is null.
     */
    private fun getGoogleSignInClient(reactContext: ReactApplicationContext): GoogleSignInClient {
      val activity = reactContext.currentActivity
      if (activity != null) {
        val signInOptions = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
          .requestEmail()
          .requestScopes(Scope(DriveScopes.DRIVE_APPDATA))
          .build()
        return GoogleSignIn.getClient(activity, signInOptions)
      } else {
        throw IllegalStateException("Activity cannot be null")
      }
    }

    /**
     * Determines if the user has permission to Google Drive.
     *
     * @param reactContext The react application context.
     * @return A Boolean value indicating whether the user has permission.
     */
    private fun hasPermissionToGoogleDrive(reactContext: ReactApplicationContext): Boolean {
      val acc = GoogleSignIn.getLastSignedInAccount(reactContext)
      val hasPermissions =
        acc?.let { GoogleSignIn.hasPermissions(acc, Scope(DriveScopes.DRIVE_APPDATA)) }
      return hasPermissions == true
    }

    /**
     * Fetches cloud backups from Google Drive and triggers corresponding events.
     *
     * @param drive The authenticated Drive object of Google Drive.
     */
    suspend fun fetchCloudBackupFiles(
      drive: Drive
    ): FileList {
      return withContext(Dispatchers.IO) {
        val files: FileList = drive.files().list()
          .setSpaces(GDriveParams.SPACES)
          .setFields(GDriveParams.FIELDS)
          .setPageSize(GDriveParams.PAGE_SIZE_NORMAL)
          .execute()

        files
      }
    }

    /**
     * Asynchronously retrieves an authenticated GoogleDrive object by gaining Google Drive permissions.
     *
     * @param reactContext The react application context.
     * @return An authenticated GoogleSignInAccount object.
     */
    private suspend fun getGoogleDrivePermissions(reactContext: ReactApplicationContext): GoogleSignInAccount? =
      suspendCancellableCoroutine { continuation ->
        try {
          val googleSignInClient = getGoogleSignInClient(reactContext)
          googleSignInClient.signOut() // Force a sign out so that we can reselect account
          val signInIntent = googleSignInClient.signInIntent
          reactContext.currentActivity?.startActivityForResult(
            signInIntent,
            Request.GOOGLE_SIGN_IN.value
          )
          val listener = object : ActivityEventListener {
            override fun onActivityResult(
              activity: Activity,
              requestCode: Int,
              resultCode: Int,
              data: Intent?
            ) {
              // Remove the listener after using it
              reactContext.removeActivityEventListener(this)
              if (requestCode == Request.GOOGLE_SIGN_IN.value && resultCode == Activity.RESULT_OK) {

                val signInTask = GoogleSignIn.getSignedInAccountFromIntent(data)
                val account: GoogleSignInAccount? =
                  signInTask.getResult(ApiException::class.java)
                continuation.resumeWith(Result.success(account))

              } else {
                continuation.resumeWith(Result.failure(Exception("Oauth process has been interrupted")))
                Log.d("Activity intent", "Intent null")
              }
            }

            override fun onNewIntent(intent: Intent) {}
          }
          reactContext.addActivityEventListener(listener)
        } catch (e: Exception) {
          Log.e("EXCEPTION", "${e.message}")
          continuation.resumeWith(
            Result.failure(
              Exception("Failed to get google drive account")
            )
          )
        }
      }

    /**
     * Asynchronously retrieves an authenticated Drive object.
     *
     * @param reactContext The react application context.
     * @return Google Drive object if user has permissions, `null` otherwise.
     */
    suspend fun getGoogleDrive(
      reactContext: ReactApplicationContext,
      useRecentAccount: Boolean = false
    ): Pair<Drive?, GoogleSignInAccount?> {
      return withContext(Dispatchers.IO) {
        val canUseRecentAccount = useRecentAccount && hasPermissionToGoogleDrive(reactContext)
        val account =
          if (canUseRecentAccount) 
            GoogleSignIn.getLastSignedInAccount(reactContext) 
          else 
            getGoogleDrivePermissions(reactContext)

        val drive = account?.let {
          val credential =
            GoogleAccountCredential.usingOAuth2(reactContext, listOf(DriveScopes.DRIVE_APPDATA))
          credential.selectedAccount = account.account!!

          Drive.Builder(
            NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            credential
          )
            .setApplicationName(reactContext.getString(R.string.app_name))
            .build()
        }

        Pair(drive, account)
      }
    }

    /**
     * Fetches the ids of every file in Google Drive with this name, newest first.
     *
     * Drive allows several files to share a name and concurrent backups have been able to create
     * duplicates, so callers decide which copy wins instead of assuming there is one.
     *
     * Failures are not swallowed: treating a network error as "no file exists" makes the caller
     * create a second copy of a backup that is already there.
     *
     * @param drive The authenticated Drive object of Google Drive.
     * @param name Name of the file.
     * @return ids of the matching files, most recently modified first.
     */
    fun getFileIdsByFileName(drive: Drive, name: String): List<String> {
      val files: FileList = drive.files().list()
        .setSpaces(GDriveParams.SPACES)
        .setFields(GDriveParams.FIELDS)
        .setPageSize(GDriveParams.PAGE_SIZE_NORMAL)
        .setOrderBy(GDriveParams.ORDER_BY_NEWEST)
        .setQ("name = '$name.json'")
        .execute()

      return files.files.mapNotNull { it.id }
    }

    /**
     * Uploads mnemonic backup to google drive in json formant
     *
     * @param drive The authenticated Drive object of Google Drive.
     * @param mnemonicId Id of saved mnemonic.
     * @param backup Instance of [CloudStorageMnemonicBackup] object representing mnemonic backup.
     * @return String fileId if file exists, `null` otherwise.
     */
    fun saveMnemonicToGoogleDrive(
      drive: Drive,
      mnemonicId: String,
      backup: CloudStorageMnemonicBackup
    ) {
      val jsonData = gson.toJson(backup)
      val jsonByteArray = jsonData.toByteArray(StandardCharsets.UTF_8)
      val inputContent = ByteArrayContent("application/json", jsonByteArray)

      val existingFileId = getFileIdsByFileName(drive, mnemonicId).firstOrNull()

      if (existingFileId != null) {
        // Replace the contents in place. Deleting first would leave the user with nothing if the
        // upload then failed, and uploading first would leave two files sharing a name, which
        // restore cannot tell apart. Drive rejects a parent change on update, so the metadata
        // passed here must not carry `parents`.
        drive.files().update(existingFileId, File(), inputContent).execute()
        return
      }

      val fileMetadata = File()
      fileMetadata.name = "$mnemonicId.json"
      fileMetadata.parents = listOf("appDataFolder")

      drive.files().create(fileMetadata, inputContent).execute()
    }
  }
}
