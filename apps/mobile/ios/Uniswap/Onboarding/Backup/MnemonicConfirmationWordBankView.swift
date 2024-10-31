//
//  MnemonicTagsView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/8/22.
//

import SwiftUI

struct BankWord: Hashable {
  var index: Int
  var word: String = ""
  var used: Bool = false
}

struct MnemonicConfirmationWordBankView: View {
  let smallFont = UIFont(name: "BaselGrotesk-Book", size: 14)
  let mediumFont = UIFont(name: "BaselGrotesk-Book", size: 16)
  
  var groupedWords: [[BankWord]] = [[BankWord]]()
  let screenWidth = UIScreen.main.bounds.width // Used to calculate max number of tags per row
  var labelCallback: ((Int) -> Void)?
  let shouldShowSmallText: Bool
  
  init(words: [String], usedWordIndexes: [Int], labelCallback: @escaping (Int) -> Void, shouldShowSmallText: Bool) {
    self.labelCallback = labelCallback
    self.shouldShowSmallText = shouldShowSmallText
    
    // Ensure that proper words are displayed as used in case of duplicates
    var wordStructs = words.enumerated().map { index, word in BankWord(index: index, word: word) }
    usedWordIndexes.forEach{ idx in
      if (idx != -1) {
        wordStructs[idx].used = true
      }
    }
    
    // Set up grouped words
    self.groupedWords = createGroupedWords(wordStructs)
  }
  
  private func createGroupedWords(_ items: [BankWord]) -> [[BankWord]] {
    var groupedItems: [[BankWord]] = [[BankWord]]()
    var tempItems: [BankWord] = [BankWord]()
    var width: CGFloat = 0
    
    for word in items {
      let label = UILabel()
      label.text = word.word
      label.sizeToFit()
      
      let labelWidth = label.frame.size.width + 32
      
      if (width + labelWidth + 32) < screenWidth {
        width += labelWidth
        tempItems.append(word)
      } else {
        width = labelWidth
        groupedItems.append(tempItems)
        tempItems.removeAll()
        tempItems.append(word)
      }
    }
    
    groupedItems.append(tempItems)
    return groupedItems
  }
  
  var body: some View {
    VStack(alignment: .center) {
      ForEach(groupedWords, id: \.self) { subItems in
        HStack(spacing: shouldShowSmallText ? 4 : 8) {
          ForEach(subItems, id: \.self) { bankWord in
            Text(bankWord.word)
              .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
              .fixedSize()
              .padding(shouldShowSmallText ? EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 10) : EdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12))
              .background(Colors.surface1)
              .foregroundColor(Colors.neutral1)
              .clipShape(RoundedRectangle(cornerRadius: 100, style: .continuous))
              .shadow(color: Color.black.opacity(0.04), radius: 10)
              .overlay(
                RoundedRectangle(cornerRadius: 50)
                  .stroke(Colors.surface3, lineWidth: 1)
              )
              .onTapGesture {
                labelCallback?(bankWord.index)
              }
              .opacity(bankWord.used ? 0.5 : 1)
          }
        }
      }
    }
  }
}
