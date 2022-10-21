//
//  MnemonicTagsView.swift
//  Uniswap
//
//  Created by Thomas Thachil on 8/8/22.
//

import SwiftUI

struct MnemonicTestWordBankView: View {
  
  let smallFont = UIFont(name: "Inter-Regular", size: 14)
  let mediumFont = UIFont(name: "Inter-Regular", size: 16)
  
  let words: [String]
  let usedWords: [String]
  var groupedWords: [[String]] = [[String]]()
  let screenWidth = UIScreen.main.bounds.width // Used to calculate max number of tags per row
  var labelCallback: ((String) -> Void)?
  let shouldShowSmallText: Bool
  
  init(words: [String], usedWords: [String], labelCallback: @escaping (String) -> Void, shouldShowSmallText: Bool) {
    self.words = words
    self.usedWords = usedWords
    self.labelCallback = labelCallback
    self.shouldShowSmallText = shouldShowSmallText
    self.groupedWords = createGroupedWords(words)
  }
  
  private func createGroupedWords(_ items: [String]) -> [[String]] {
    
    var groupedItems: [[String]] = [[String]]()
    var tempItems: [String] =  [String]()
    var width: CGFloat = 0
    
    for word in items {
      
      let label = UILabel()
      label.text = word
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
          ForEach(subItems, id: \.self) { word in
            let text = Text(word)
              .font(Font((shouldShowSmallText ? smallFont : mediumFont)!))
              .fixedSize()
              .padding(shouldShowSmallText ? EdgeInsets(top: 4, leading: 12, bottom: 4, trailing: 12) : EdgeInsets(top: 6, leading: 12, bottom: 6, trailing: 12))
              .background(Colors.background1)
              .foregroundColor(Colors.textPrimary)
              .clipShape(RoundedRectangle(cornerRadius: 16.0, style: .continuous))
              .onTapGesture {
                labelCallback?(word)
              }
            
            if (usedWords.contains(word)) {
              text.opacity(0.60)
            } else {
              text
            }
          }
        }
      }
    }
  }
}
