import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './fixed-data-table.css';

ReactDOM.render(
  <App source="https://ushydro.ucsd.edu/hydrotable/json"/>,
  document.getElementById('root')
);
