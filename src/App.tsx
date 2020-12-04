import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import 'antd/dist/antd.css';

const Cell = ({ record }: { record: any }) => {
  if (record === undefined) {
    return <div>-</div>
  }

  return record.map((item: any) => {
    if (item.href !== null) {
      return <div><a href={item.href}>{item.text}</a></div>
    }
    return <div>{item.text}</div>;
  })
}

function App() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([])

  useEffect(() => {
    (async () => {
      const data = await fetch("https://hydrotable.cchdo.io/hydrotable/json")
      const parsed = await data.json()
      setColumns(parsed.columns)
      setRows(parsed.rows)
    })()
  }, []);

  const tableCols = columns.map((colName) => {
    return {
      title: colName,
      dataIndex: colName,
      key: colName,
      width: 250,
      fixed: colName === "Cruise",
      render: (record: any) => <Cell record={record} />
    }
  })

  return (
    <div className="App">
      <Table columns={tableCols} dataSource={rows} scroll={{ x: tableCols.length * 250 }} sticky pagination={false} />
    </div>
  );
}

export default App;
