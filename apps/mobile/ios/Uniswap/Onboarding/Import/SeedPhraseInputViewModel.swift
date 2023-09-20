//
//  SeedPhraseInputViewModel.swift
//  Uniswap
//
//  Created by Gary Ye on 9/10/23.
//

import Foundation

class SeedPhraseInputViewModel: ObservableObject {
  
  enum Status: String {
    case none
    case valid
    case error
  }
  
  enum Error {
    case invalidWord(String)
    case tooManyWords
    case notEnoughWords
    case wrongRecoveryPhrase
  }
  
  let rnEthersRS = RNEthersRS()
  
  // Following block of variables will come from RN
  @Published var targetMnemonicId: String? = nil
  @Published var helpText: String = ""
  @Published var onHelpTextPress: RCTDirectEventBlock = { _ in }
  @Published var onInputValidated: RCTDirectEventBlock = { _ in }
  @Published var onMnemonicStored: RCTDirectEventBlock = { _ in }
  @Published var onPasteStart: RCTDirectEventBlock = { _ in }
  @Published var onPasteEnd: RCTDirectEventBlock = { _ in }
  
  @Published var input = "" {
    didSet {
      validateInput()
    }
  }
  @Published var status: Status = .none
  @Published var error: Error? = nil

  private var wordlistSet: Set<String> = Set()
  
  private let minCount = 12
  private let maxCount = 24
  
  init() {
    do {
      // TODO gary replace local json wordlist with ethers support
      let asset = NSDataAsset(name: "bip39_english.json")
      let wordlist = try JSONDecoder().decode([String].self, from: asset!.data)
      wordlistSet = Set(wordlist)
    } catch {
      // TODO gary add error logging
      print("SeedPhraseInputViewModel load wordlist error " + error.localizedDescription)
    }
  }
  
  func handleSubmit() {
    let normalized = normalizeInput(value: input)
    let mnemonic = trimInput(value: normalized)
    let words = mnemonic.components(separatedBy: " ")
    
    if (words.count < minCount) {
      status = .error
      error = .notEnoughWords
    } else if (words.count > maxCount) {
      status = .error
      error = .tooManyWords
    } else {
      submitMnemonic(mnemonic: mnemonic)
    }
  }
  
  private func submitMnemonic(mnemonic: String) {
    if (targetMnemonicId != nil) {
      rnEthersRS.generateAddressForMnemonic(
        mnemonic: mnemonic,
        derivationIndex: 0,
        resolve: { mnemonicId in
          if (targetMnemonicId == String(describing: mnemonicId ?? "")) {
            storeMnemonic(mnemonic: mnemonic)
          } else {
            error = .wrongRecoveryPhrase
          }
        }, reject: { code, message, error in
          // TODO gary update ethers library to catch exception or send in reject
          print("SeedPhraseInputView model error while generating address: \(message ?? "")")
        })
    } else {
      storeMnemonic(mnemonic: mnemonic)
    }
  }
  
  private func storeMnemonic(mnemonic: String) {
    rnEthersRS.importMnemonic(
      mnemonic: mnemonic,
      resolve: { mnemonicId in
        onMnemonicStored(["mnemonicId": String(describing: mnemonicId ?? "")])
      },
      reject: { code, message, error in
        // TODO gary update ethers library to catch exception or send in reject
        print("SeedPhraseInputView model error while storing mnemonic: \(message ?? "")")
      }
    )
  }
  
  private func normalizeInput(value: String) -> String {
    return value.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression).lowercased()
  }
  
  private func trimInput(value: String) -> String {
    return value.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  
  private func validateInput() {
    let normalized = normalizeInput(value: input)
    let skipLastWord = normalized.last != " "
    let mnemonic = trimInput(value: normalized)

    let words = mnemonic.components(separatedBy: " ")
    if words.count == 0 {
      status = .none
      return
    }
    
    let isValidLength = words.count >= minCount && words.count <= maxCount
    let firstInvalidMnemonic = findFirstInvalidMnemonic(words: words)
    
    if (firstInvalidMnemonic == words.last && skipLastWord) {
      status = .none
    } else if (firstInvalidMnemonic == nil && isValidLength) {
      status = .valid
    } else if (firstInvalidMnemonic != nil) {
      status = .error
      error = .invalidWord(firstInvalidMnemonic ?? "")
    } else {
      status = .none
    }
    
    if (status != .error) {
      error = nil
    }
    
    let canSubmit = error == nil && mnemonic != "" && firstInvalidMnemonic == nil
    onInputValidated(["canSubmit": canSubmit])
  }
  
  private func findFirstInvalidMnemonic(words: [String]) -> String? {
    for word in words {
      if !wordlistSet.contains(word) {
        return word
      }
    }
    return nil
  }
}
