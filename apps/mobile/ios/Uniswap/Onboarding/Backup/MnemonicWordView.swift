//
//  MnemonicWord.swift
//  Uniswap
//
//  Created by Spencer Yen on 5/24/22.
//

import Foundation

class MnemonicWordView: UIView {
  private var index: Int?
  private var word: String?
  
  required init(index: Int, word: String) {
    super.init(frame: CGRect(x: 0, y: 0, width: 0, height: 0))
    self.index = index
    self.word = word
    self.setupView()
  }
  
  required override init(frame: CGRect) {
    super.init(frame: frame)
    self.setupView()
  }
  
  required init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    self.setupView()
  }
  
  private func setupView() {
    self.layer.cornerRadius = 24
    self.layer.masksToBounds = true
    let indexLabel = UILabel()
    indexLabel.text = String(describing: self.index!)
    indexLabel.adjustsFontSizeToFitWidth = true
    indexLabel.font = UIFont.init(name: "Basel-Book", size: 16)
    
    let wordLabel = UILabel()
    wordLabel.text = self.word
    wordLabel.adjustsFontSizeToFitWidth = true
    wordLabel.font = UIFont.init(name: "Basel-Book", size: 16)
    
    let stackView = UIStackView(arrangedSubviews: [indexLabel, wordLabel])
    stackView.axis = .horizontal
    stackView.distribution = .equalSpacing
    stackView.alignment = .leading
    stackView.spacing = 12.0
    stackView.translatesAutoresizingMaskIntoConstraints = false
    stackView.isLayoutMarginsRelativeArrangement = true
    stackView.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
    self.addSubview(stackView)
    
    stackView.centerYAnchor.constraint(equalTo: self.centerYAnchor).isActive = true
    
    if traitCollection.userInterfaceStyle == .light {
      self.layer.backgroundColor = UIColor.init(red: 249/255.0, green: 249/255.0, blue: 249/255.0, alpha: 1.0).cgColor
      self.layer.borderColor = UIColor.init(red: 34/255.0, green: 34/255.0, blue: 34/255.0, alpha: 0.05).cgColor
      indexLabel.textColor = UIColor.init(red: 125/255.0, green: 125/255.0, blue: 125/255.0, alpha: 1.0)
      wordLabel.textColor = UIColor.black
    } else {
      self.layer.backgroundColor = UIColor.init(red: 27/255.0, green: 27/255.0, blue: 27/255.0, alpha: 1.0).cgColor
      self.layer.borderColor = UIColor.init(red: 255/255.0, green: 255/255.0, blue: 255/255.0, alpha: 0.12).cgColor
      indexLabel.textColor = UIColor.init(red: 155/255.0, green: 155/255.0, blue: 155/255.0, alpha: 1.0)
      wordLabel.textColor = UIColor.white
    }
  }
}
