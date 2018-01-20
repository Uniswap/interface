import React, { Component } from 'react'
import Select from 'react-select'
import './SelectToken.css'

class SelectToken extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedOption: this.props.token,
    }
  }
  handleChange = (selectedOption) => {
    this.setState({ selectedOption })
    this.props.onSelectToken(selectedOption, this.props.type)
    // console.log(`Selected: ${selectedOption.label}`)
  }
  render () {
    const { selectedOption } = this.state
    const value = selectedOption && selectedOption.value

    return (
      <Select
        name="form-field-name"
        value={value}
        onChange={this.handleChange}
        className="select"
        options={[
          { value: 'ETH', label: 'ETH', clearableValue: false },
          { value: 'UNI', label: 'UNI', clearableValue: false },
          { value: 'SWAP', label: 'SWAP', clearableValue: false },
        ]}
      />
    )
  }
}

export default SelectToken;
