import React, { Component } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

class Candlesticks extends Component {
  constructor (props) {
    super(props);
    this.state = {
      data: null
    }
    this.visualizeData.bind(this)
  }

  // note, this url is being used for development
  // the actual url will be wherever the API is hosted 
  componentDidMount() {
    let query = `{
      Event(input:"UNI") {
        ethValueOfToken
        createdAt
      }
    }`;

    axios.get('http://localhost:3000/graphql', { params: { query: query } })
    .then(data => this.setState({data: data.data.data.Event}))
    .then(()=> this.visualizeData())
    .catch(err => console.error(err));
  }

  visualizeData() {
    let svg = d3.select('svg');
    let coeff = 1000 * 60 * 15

    let nested_date = d3.nest()
      .key((d) => new Date (Math.round(new Date(d.createdAt).getTime() / coeff) * coeff))
      .sortValues()
      .entries(this.state.data)
    
    console.log(nested_date, 'something better happen here')

    // var enter = svg.selectAll('rect')
    //  .data(this.state.data)
    //  .enter()
    //  .append('rect')
  
  }


  render() {
    return (
     <svg>
     </svg>
    )
  }
}

export default Candlesticks;