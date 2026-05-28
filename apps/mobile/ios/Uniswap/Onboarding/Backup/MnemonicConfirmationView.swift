//
//  MnemonicConfirmationView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/1/22.
//

import React
import SwiftUI

// Standard HD wallet mnemonic length (BIP-39 12 words). Embedded wallets use 24.
fileprivate let mnemonicLengthHD = 12

@objcMembers class MnemonicConfirmationView: NSObject {
  private var vc = UIHostingController(rootView: MnemonicConfirmation())

  static let storage = NSMutableDictionary()

  var mnemonicId: String {
    set { vc.rootView.setMnemonicId(mnemonicId: newValue) }
    get { return vc.rootView.props.mnemonicId }
  }

  var selectedWordPlaceholder: String {
    set { vc.rootView.props.selectedWordPlaceholder = newValue}
    get { return vc.rootView.props.selectedWordPlaceholder }
  }

  var shouldShowSmallText: Bool {
    set { vc.rootView.props.shouldShowSmallText = newValue}
    get { return vc.rootView.props.shouldShowSmallText }
  }

  var onConfirmComplete: RCTDirectEventBlock {
    set { vc.rootView.props.onConfirmComplete = newValue }
    get { return vc.rootView.props.onConfirmComplete }
  }

  var pageStart: Int {
    set {
      vc.rootView.props.pageStart = newValue
      vc.rootView.applyPageSlice()
    }
    get { return vc.rootView.props.pageStart }
  }

  var pageSize: Int {
    set {
      vc.rootView.props.pageSize = newValue
      vc.rootView.applyPageSlice()
    }
    get { return vc.rootView.props.pageSize }
  }

  var currentPage: Int {
    set { vc.rootView.props.currentPage = newValue }
    get { return vc.rootView.props.currentPage }
  }

  var totalPages: Int {
    set { vc.rootView.props.totalPages = newValue }
    get { return vc.rootView.props.totalPages }
  }

  var view: UIView {
    vc.view.backgroundColor = .clear
    return vc.view
  }
}

class MnemonicConfirmationProps : ObservableObject {
  @Published var mnemonicId: String = ""
  @Published var selectedWordPlaceholder: String = ""
  @Published var shouldShowSmallText: Bool = false
  @Published var onConfirmComplete: RCTDirectEventBlock = { _ in }
  @Published var mnemonicWords: [String] = Array(repeating: "", count: mnemonicLengthHD)
  @Published var scrambledWords: [String] = Array(repeating: "", count: mnemonicLengthHD)
  @Published var typedWordIndexes: [Int] = Array(repeating: -1, count: mnemonicLengthHD)
  @Published var selectedIndex: Int = 0
  // Pagination: when pageSize > 0, the view confirms only words[pageStart..<pageStart+pageSize].
  // pageSize == 0 means "use the full mnemonic" (single-page mode, default).
  @Published var pageStart: Int = 0
  @Published var pageSize: Int = 0
  // Page indicator dots: only shown when totalPages > 1.
  @Published var currentPage: Int = 0
  @Published var totalPages: Int = 0
}

struct MnemonicConfirmation: View {

  @ObservedObject var props = MnemonicConfirmationProps()

  let rnEthersRS = RNEthersRS()

  func setMnemonicId(mnemonicId: String) {
    props.mnemonicId = mnemonicId
    applyPageSlice()
  }

  // Recompute the slice-sized scrambled bank and typed-index buffer.
  // Safe to call multiple times during prop wiring; a no-op until mnemonicId is set.
  func applyPageSlice() {
    guard !props.mnemonicId.isEmpty,
          let mnemonic = rnEthersRS.retrieveMnemonic(mnemonicId: props.mnemonicId) else {
      return
    }

    let allWords = mnemonic.components(separatedBy: " ")
    props.mnemonicWords = allWords

    let pageStart = max(0, props.pageStart)
    let remaining = max(0, allWords.count - pageStart)
    let effectiveSize = props.pageSize > 0 ? min(props.pageSize, remaining) : remaining
    let sliceEnd = pageStart + effectiveSize
    let slice = effectiveSize > 0 ? Array(allWords[pageStart..<sliceEnd]) : []

    props.scrambledWords = slice.shuffled()
    props.typedWordIndexes = Array(repeating: -1, count: slice.count)
    props.selectedIndex = 0
  }

  func onSuggestionTapped(tappedIndex: Int) {
    guard props.selectedIndex >= 0 && props.selectedIndex < props.typedWordIndexes.count else {
      return
    }
    props.typedWordIndexes[props.selectedIndex] = tappedIndex

    if props.selectedIndex == props.typedWordIndexes.count - 1 {
      if isMnemonicMatch() {
        props.onConfirmComplete([:])
      }
    } else if expectedWord(displayIndex: props.selectedIndex) == props.scrambledWords[tappedIndex] {
      props.selectedIndex += 1
    }
  }

  func isMnemonicMatch() -> Bool {
    for i in 0..<props.typedWordIndexes.count {
      if getTypedWord(displayIndex: i) != expectedWord(displayIndex: i) {
        return false
      }
    }
    return true
  }

  // The expected mnemonic word for a given cell, accounting for the page offset.
  func expectedWord(displayIndex: Int) -> String {
    let absoluteIndex = max(0, props.pageStart) + displayIndex
    guard absoluteIndex >= 0 && absoluteIndex < props.mnemonicWords.count else {
      return ""
    }
    return props.mnemonicWords[absoluteIndex]
  }

  func getTypedWord(displayIndex: Int) -> String {
    guard displayIndex >= 0 && displayIndex < props.typedWordIndexes.count else {
      return ""
    }
    let scrambledWordIndex = props.typedWordIndexes[displayIndex]
    guard scrambledWordIndex >= 0 && scrambledWordIndex < props.scrambledWords.count else {
      return ""
    }
    return props.scrambledWords[scrambledWordIndex]
  }

  func getFieldText(displayIndex: Int) -> String {
    let typedWord = getTypedWord(displayIndex: displayIndex)
    return typedWord.isEmpty ? props.selectedWordPlaceholder : typedWord
  }

  func getFieldStatus(displayIndex: Int) -> MnemonicInputStatus {
    let typedWord = getTypedWord(displayIndex: displayIndex)
    if typedWord.isEmpty {
      return MnemonicInputStatus.noInput
    }
    if expectedWord(displayIndex: displayIndex) != typedWord {
      return MnemonicInputStatus.wrongInput
    }
    return MnemonicInputStatus.correctInput
  }

  var body: some View {
    let pageStart = max(0, props.pageStart)
    let displayCount = props.typedWordIndexes.count
    let end = displayCount - 1
    let middle = end / 2

    VStack(alignment: .leading, spacing: 0) {
      if displayCount > 0 {
        HStack(alignment: .center, spacing: 24) {
          VStack(alignment: .leading, spacing: 8) {
            ForEach((0...middle), id: \.self) { i in
              MnemonicTextField(index: pageStart + i + 1,
                                word: getFieldText(displayIndex: i),
                                status: getFieldStatus(displayIndex: i),
                                shouldShowSmallText: props.shouldShowSmallText
              )
              .frame(maxWidth: .infinity, alignment: .leading)
            }
          }.frame(maxWidth: .infinity)
          VStack(alignment: .leading, spacing: 8) {
            if middle + 1 <= end {
              ForEach((middle + 1...end), id: \.self) { i in
                MnemonicTextField(index: pageStart + i + 1,
                                  word: getFieldText(displayIndex: i),
                                  status: getFieldStatus(displayIndex: i),
                                  shouldShowSmallText: props.shouldShowSmallText
                )
                .frame(maxWidth: .infinity, alignment: .leading)
              }
            }
          }.frame(maxWidth: .infinity)
        }.frame(maxWidth: .infinity)
          .padding(EdgeInsets(top: 24, leading: 32, bottom: 24, trailing: 32))
          .background(Colors.surface2)
          .cornerRadius(20)
          .overlay(
            RoundedRectangle(cornerRadius: 20)
              .stroke(Colors.surface3, lineWidth: 1)
          )
      }

      if props.totalPages > 1 {
        HStack(spacing: 6) {
          ForEach(0..<props.totalPages, id: \.self) { i in
            Circle()
              .fill(i == props.currentPage ? Colors.neutral1 : Colors.neutral3)
              .frame(width: 6, height: 6)
          }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 16)
      }

      MnemonicConfirmationWordBankView(
        words: props.scrambledWords,
        usedWordIndexes: props.typedWordIndexes,
        labelCallback: onSuggestionTapped,
        shouldShowSmallText: props.shouldShowSmallText
      )
      .frame(maxWidth: .infinity)
      .padding(.top, props.totalPages > 1 ? 16 : 24)

    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }
}
