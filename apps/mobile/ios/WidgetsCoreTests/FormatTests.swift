//
//  FormatTests.swift
//  UniswapWidgetsCoreTests
//
//  Created by Eric Huang on 7/25/23.
//

import XCTest
import WidgetsCore

final class FormatTests: XCTestCase {
  
  func testFiatTokenDetailsFormatter() throws {
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.05), "$0.050")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.056666666), "$0.057")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 1234567.891), "$1.23M")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 1234.5678), "$1,234.57")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 1.048952), "$1.049")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.001231), "$0.00123")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.00001231), "$0.0000123")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.0000001234), "$0.000000123")
    XCTAssertEqual(NumberFormatter.fiatTokenDetailsFormatter(price: 0.000000009876), "<$0.00000001")
  }
}
