import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './fixed-data-table.css';

ReactDOM.render(
  <App source="https://hydrotable.cchdo.io/hydrotable/json"/>,
  document.getElementById('root')
);
