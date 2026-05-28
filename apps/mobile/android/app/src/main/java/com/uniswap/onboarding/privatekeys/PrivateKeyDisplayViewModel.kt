package com.uniswap.onboarding.privatekeys

import androidx.lifecycle.ViewModel
import com.uniswap.RnEthersRs
import kotlinx.coroutines.flow.MutableStateFlow

open class PrivateKeyDisplayViewModel(
  private val ethersRs: RnEthersRs
) : ViewModel() {

  val privateKey = MutableStateFlow("")
  fun setup(address: String) {
    ethersRs.retrievePrivateKey(address)?.let { mnemonic ->
      privateKey.value = mnemonic
    }
  }
}
