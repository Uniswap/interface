//
//  MnemonicTagsView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/8/22.
//

import SwiftUI

struct BankWord: Hashable {
  var word: String = ""
  var used: Bool = false
}

struct MnemonicConfirmationWordBankView: View {
  
  let smallFont = UIFont(name: "Basel-Book", size: 14)
  let mediumFont = UIFont(name: "Basel-Book", size: 16)

  var groupedWords: [[BankWord]] = [[BankWord]]()
  let screenWidth = UIScreen.main.bounds.width // Used to calculate max number of tags per row
  var labelCallback: ((String) -> Void)?
  let shouldShowSmallText: Bool
  
  init(words: [String], usedWords: [String], labelCallback: @escaping (String) -> Void, shouldShowSmallText: Bool) {
    self.labelCallback = labelCallback
    self.shouldShowSmallText = shouldShowSmallText
    
    // Mark words as used individually to handle case of duplicate words
    var wordStructs = words.map { word in BankWord(word: word) }
    // Use used words to mark used
    usedWords.forEach{ usedWord in
      for idx in 0...wordStructs.count-1 {
        if (usedWord == wordStructs[idx].word && !wordStructs[idx].used) {
          wordStructs[idx].used = true
          return
        }
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
        HStack(spacing: 8) {
          ForEach(subItems, id: \.self) { bankWord in
            Text(bankWord.word)
              .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
              .fixedSize()
              .padding(shouldShowSmallText ? EdgeInsets(top: 4, leading: 12, bottom: 4, trailing: 12) : EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
              .background(Colors.surface2)
              .foregroundColor(Colors.neutral1)
              .clipShape(RoundedRectangle(cornerRadius: 100, style: .continuous))
              .onTapGesture {
                labelCallback?(bankWord.word)
              }
              .opacity(bankWord.used ? 0.60 : 1)
          }
        }
      }
    }
  }
}
