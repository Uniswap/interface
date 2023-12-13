//
//  FormatTests.swift
//  UniswapWidgetsCoreTests
//
//  Created by Eric Huang on 7/25/23.
//

import XCTest
import WidgetsCore

final class FormatTests: XCTestCase {
  
  let localeEnglish = Locale(identifier: "en")
  let localeFrench = Locale(identifier: "fr-FR")
  let localeChinese = Locale(identifier: "zh-Hans")
  
  let currencyCodeUsd = WidgetConstants.currencyUsd
  let currencyCodeEuro = "EUR"
  let currencyCodeYuan = "CNY"
  
  struct TestCase {
    public init(_ price: Double, _ output: String) {
      self.price = price
      self.output = output
    }
    
    public let price: Double
    public let output: String
  }
  
  func testFormatterHandlesEnglish() throws {
    
    let testCases = [
      TestCase(0.05, "$0.050"),
      TestCase(0.056666666, "$0.057"),
      TestCase(1234567.891, "$1.23M"),
      TestCase(1234.5678, "$1,234.57"),
      TestCase(1.048952, "$1.049"),
      TestCase(0.001231, "$0.00123"),
      TestCase(0.00001231, "$0.0000123"),
      TestCase(0.0000001234, "$0.000000123"),
      TestCase(0.000000009876, "<$0.00000001"),
    ]
    
    testCases.forEach { testCase in
      XCTAssertEqual(
        NumberFormatter.fiatTokenDetailsFormatter(
          price: testCase.price,
          locale: localeEnglish,
          currencyCode: currencyCodeUsd
        ),
        testCase.output
      )
    }
  }
  
  func testFormatterHandlesFrench() throws {
    let testCases = [
      TestCase(0.05, "0,050 €"),
      TestCase(0.056666666, "0,057 €"),
      TestCase(1234567.891, "1,23 M €"),
      TestCase(123456.7890, "123 456,79 €"),
      TestCase(1.048952, "1,049 €"),
      TestCase(0.001231, "0,00123 €"),
      TestCase(0.00001231, "0,0000123 €"),
      TestCase(0.0000001234, "0,000000123 €"),
      TestCase(0.000000009876, "<0,00000001 €"),
    ]
    
    testCases.forEach { testCase in
      XCTAssertEqual(
        NumberFormatter.fiatTokenDetailsFormatter(
          price: testCase.price,
          locale: localeFrench,
          currencyCode: currencyCodeEuro
        ),
        testCase.output
      )
    }
  }
  
  func testFormatterHandlesChinese() throws {
    let testCases = [
      TestCase(0.05, "¥0.050"),
      TestCase(0.056666666, "¥0.057"),
      TestCase(1234567.891, "¥123.46万"),
      TestCase(1234.5678, "¥1,234.57"),
      TestCase(1.048952, "¥1.049"),
      TestCase(0.001231, "¥0.00123"),
      TestCase(0.00001231, "¥0.0000123"),
      TestCase(0.0000001234, "¥0.000000123"),
      TestCase(0.000000009876, "<¥0.00000001"),
    ]
    
    testCases.forEach { testCase in
      XCTAssertEqual(
        NumberFormatter.fiatTokenDetailsFormatter(
          price: testCase.price,
          locale: localeChinese,
          currencyCode: currencyCodeYuan
        ),
        testCase.output
      )
    }
  }
}
