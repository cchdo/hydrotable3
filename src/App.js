import React, { Component } from 'react';
import $ from 'jquery';
import {Column, Cell} from 'fixed-data-table';
import ResponsiveFixedDataTable from 'responsive-fixed-data-table';


class CustomCell extends Component{
  getData(data, index, col){
        try{
            return data[index][col].map(function(cell){
              if (cell.href){
              return (
                  <li className={cell.status}>
                    <a target="_blank" href={cell.href}>{cell.text}</a>
                  </li>
                  )
              } else {
              return (
                  <li className={cell.status}>
                    {cell.text}
                  </li>
                  )
              }
            });
        } catch (e) {
          return "-"
        }
  }
  render() {
    const {rowIndex, field, data, ...props} = this.props;
    return (
      <Cell {...props}>
      <ul>
      {
        this.getData(this.props.data, rowIndex, this.props.col)
      }
      </ul>
      </Cell>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
		  rows:[], columns:[]
    };

    this.getRowHeight = this.getRowHeight.bind(this);
  }

  componentDidMount(){
    this.serverRequest = $.getJSON(this.props.source, function(result){
        var rows = result.rows;
        result.rows = rows.sort(function(a, b){
          try {
            var x = a["Dates"][0].text.split("to");
            var y = b["Dates"][0].text.split("to");
            x = Date.parse(x[0].trim())
            y = Date.parse(y[0].trim())
            var res = x > y ? -1 : x < y ? 1 : 0;
            return res;
          } catch (error) {
            // Fall back to string comparison
            var x = a["Dates"][0].text;
            var y = b["Dates"][0].text;
            var res = x > y ? -1 : x < y ? 1 : 0;
            return res;

          }
        });
        this.setState(result);
      }.bind(this));
  }

  getRowHeight(rowIndex){
    var row = this.state.rows[rowIndex];
    var rowItemLengths = Object.keys(row).map(function(key){return row[key].length});
    const margins = 26;
    const liHeight = 18;
    return margins + liHeight * Math.max.apply(null, rowItemLengths);
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
            width={250}
            />
          )
    }.bind(this));

    return (
			 <ResponsiveFixedDataTable
        rowsCount={this.state.rows.length}
        rowHeight={50}
        rowHeightGetter={this.getRowHeight}
        headerHeight={50}
        width={1000}
        height={500}>
        {cols}
      </ResponsiveFixedDataTable>
    );
  }
}

export default App;
