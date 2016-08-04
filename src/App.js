import React, { Component } from 'react';
import $ from 'jquery';
import {Table, Column, Cell} from 'fixed-data-table';

class CustomCell extends Component{
	shouldComponentUpdate(){
    return false;
  }
  getData(data, index, col){
        try{
          console.log(this);
          return data[index][col][0].text
        } catch (e) {
          return "-"
        }
  }
  render() {
    const {rowIndex, field, data, ...props} = this.props;
    return (
      <Cell {...props}>
      {
        this.getData(this.props.data, rowIndex, this.props.col)
      }
      </Cell>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
		rows:[], columns:[]};
  }

  componentDidMount(){
    this.serverRequest = $.getJSON(this.props.source, function(result){
        this.setState(result);
      }.bind(this));
  }

  render() {
    var cols = this.state.columns.map(function(col){
      return (
          <Column
            allowCellsRecycling={true}
            header={<Cell>{col}</Cell>}
            fixed={(col=="Cruise")}
            cell={props => (
                <CustomCell {...props} col={col} data={this.state.rows}/>
                )}
            width={200}
            />
          )
    }.bind(this));
    return (
			 <Table
        rowsCount={this.state.rows.length}
        rowHeight={50}
        headerHeight={50}
        width={1000}
        height={500}>
        {cols}
      </Table>
    );
  }
}

export default App;
