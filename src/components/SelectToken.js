import React, { Component } from 'react';
import Select from 'react-select';
import './SelectToken.css';
import { connect } from 'react-redux';

class SelectToken extends Component {
  constructor (props) {
    super(props)
    this.state = {
      selectedOption: this.props.token,
      tokenList: []
    }
  }
  
  componentDidMount() {
    let tokenList = this.createTokenList();
    this.setState({ tokenList })
  }

  handleChange = (selectedOption) => {
    this.setState({ selectedOption });
    this.props.onSelectToken(selectedOption, this.props.type)
    // console.log(`Selected: ${selectedOption.label}`)
  }

  createTokenList = () => {
    let tokens = this.props.web3Store.tokenAddresses.addresses; 
    let tokenList = [ { value: 'ETH', label: 'ETH', clearableValue: false } ];

    for (let i = 0; i < tokens.length; i++) {
      let entry = { value: '', label: '', clearableValue: false }
      entry.value = tokens[i][0];
      entry.label = tokens[i][0];
      tokenList.push(entry);
    }
   
    return tokenList; 
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
        options={this.state.tokenList}
      />
    )
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store
})

export default connect(mapStateToProps)(SelectToken);
