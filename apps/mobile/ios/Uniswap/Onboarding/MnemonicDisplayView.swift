//
//  MnemonicDisplay.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

import Foundation
import UIKit

class MnemonicDisplayView: UIView {
  
  @objc var mnemonicId: String = ""
  
  override init(frame: CGRect) {
    super.init(frame: frame)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override public func layoutSubviews() {
    super.layoutSubviews()
    self.setupView()
  }
  
  private func setupView() {
    let rnEthersRs = RNEthersRS()

    guard let mnemonic = rnEthersRs.retrieveMnemonic(mnemonicId: mnemonicId) else {
      let wordLabel = UILabel(frame: CGRect(x: 0, y: 0, width: 300, height: 50))
      wordLabel.text = "Error loading recovery phrase"
      wordLabel.textColor = UIColor.lightGray
      wordLabel.font = UIFont.init(name: "Basel-Book", size: 16)
      wordLabel.textAlignment = .center
      self.addSubview(wordLabel)
      
      return
    }
  
    let mnemonicArray = mnemonic.components(separatedBy: " ")
    
    if (mnemonicArray.count > 12) {
      // Show alternate display for >12 word seed phrases
      let seedPhraseView = UITextView()
      seedPhraseView.text =  mnemonic
      seedPhraseView.font = UIFont.init(name: "Basel-Book", size: 16)
      seedPhraseView.textContainerInset = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
      seedPhraseView.textAlignment = .center
      seedPhraseView.layer.cornerRadius = 100
      seedPhraseView.layer.masksToBounds = true
      seedPhraseView.translatesAutoresizingMaskIntoConstraints = false
      seedPhraseView.isScrollEnabled = false
    
      if traitCollection.userInterfaceStyle == .light {
        seedPhraseView.backgroundColor = UIColor.init(red: 249/255.0, green: 249/255.0, blue: 249/255.0, alpha: 1.0)
        seedPhraseView.layer.borderColor = UIColor.init(red: 34/255.0, green: 34/255.0, blue: 34/255.0, alpha: 0.05).cgColor
        seedPhraseView.textColor = UIColor.black
      } else {
        seedPhraseView.backgroundColor = UIColor.init(red: 27/255.0, green: 27/255.0, blue: 27/255.0, alpha: 1.0)
        seedPhraseView.layer.borderColor = UIColor.init(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 0.12).cgColor
        seedPhraseView.textColor = UIColor.white
      }

      self.addSubview(seedPhraseView)

      NSLayoutConstraint.activate([
        seedPhraseView.topAnchor.constraint(equalTo: self.topAnchor),
        seedPhraseView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
        seedPhraseView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
      ])
      
      
    } else {
      let parentStackView = UIStackView()
      parentStackView.translatesAutoresizingMaskIntoConstraints = false
      parentStackView.alignment = .fill
      parentStackView.axis = .horizontal
      parentStackView.distribution = .equalSpacing
      self.addSubview(parentStackView)
      
      let leftStackView = UIStackView()
      leftStackView.translatesAutoresizingMaskIntoConstraints = false
      leftStackView.alignment = .fill
      leftStackView.axis = .vertical
      leftStackView.distribution = .fillEqually
      leftStackView.spacing = 12
      parentStackView.addSubview(leftStackView)
      
      let rightStackView = UIStackView()
      rightStackView.translatesAutoresizingMaskIntoConstraints = false
      rightStackView.alignment = .fill
      rightStackView.axis = .vertical
      rightStackView.distribution = .fillEqually
      rightStackView.spacing = 12
      parentStackView.addSubview(rightStackView)
      
      let halfway = mnemonicArray.count/2
      for index in 0...halfway-1 {
        let wordView = MnemonicWordView(index: index+1, word: mnemonicArray[index])
        leftStackView.addArrangedSubview(wordView)
      }
      
      for index in halfway...mnemonicArray.count-1 {
        let wordView = MnemonicWordView(index: index+1, word: mnemonicArray[index])
        rightStackView.addArrangedSubview(wordView)
      }
      
      NSLayoutConstraint.activate([
        parentStackView.topAnchor.constraint(equalTo: self.topAnchor),
        parentStackView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
        parentStackView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
        parentStackView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
        
        leftStackView.heightAnchor.constraint(equalTo: parentStackView.heightAnchor),
        rightStackView.heightAnchor.constraint(equalTo: parentStackView.heightAnchor),
        leftStackView.widthAnchor.constraint(equalTo: rightStackView.widthAnchor),
        
        leftStackView.trailingAnchor.constraint(equalTo: rightStackView.leadingAnchor, constant: -20),
        leftStackView.leadingAnchor.constraint(equalTo: parentStackView.leadingAnchor),
        rightStackView.trailingAnchor.constraint(equalTo: parentStackView.trailingAnchor)
      ])
    }
  }
}
