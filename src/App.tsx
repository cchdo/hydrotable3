import React, { useEffect, useState, memo } from 'react';
import { Table, Tag } from 'antd';
import XLSX from "xlsx"
import 'antd/dist/antd.css';

interface HTRecord {
  text: string | number | null;
  href: string | null;
  status: string | null;
}

const downloadXLS = (columns:any, rows:any) => {
  const sortedRows = rows.sort(sorter("Dates"))
  const data = sortedRows.map((row:any) => {
    return columns.map((col:any) => {
      let cell = row[col]
      if (cell === undefined){
        return undefined
      }
      let cell_text = cell.map((data:HTRecord) => data.text).join("; ")
      return cell_text
    })
  })
  const workbook = XLSX.utils.book_new()
  const hydrotable = XLSX.utils.aoa_to_sheet([columns, ...data])

  XLSX.utils.book_append_sheet(workbook, hydrotable, "Hydrotable")

  let not_received_data:any = []
  sortedRows.forEach((row:any) => {
    let cruise = row["Cruise"][0].text
    return columns.forEach((col:any) => {
      let cell = row[col]
      if (cell === undefined){
        return undefined
      }
      cell.forEach((rec:HTRecord) => {
        if (rec.status !== null && rec.status.includes("not_yet")){
          not_received_data.push([rec.text, col, cruise])
        }
      })
    })
  })


  const not_received = XLSX.utils.aoa_to_sheet([["PI", "Param", "Cruise"], ...not_received_data])
  XLSX.utils.book_append_sheet(workbook, not_received, "Not Received")

  XLSX.writeFile(workbook, "hydrotable.xlsx")
}

const Cell = memo(({ record }: { record: any }) => {
  if (record === undefined) {
    return <div>-</div>
  }


  return record.map((item: HTRecord) => {
    let final;
    let preliminary;
    let notyet;
    if (item.status !== null && item.status.includes("final")){
      final = <Tag color="green">Final</Tag>
    }
    if (item.status !== null && item.status.includes("preliminary")){
      preliminary = <Tag color="yellow">Submitted</Tag>
    }
    if (item.status !== null && item.status.includes("not_yet")){
      notyet = <Tag color="red">Not Received</Tag>
    }
    if (item.href !== null) {
    return <div>{final}{preliminary}{notyet} <a href={item.href}>{item.text}</a></div>
    }
    return <div>{final}{preliminary}{notyet} {item.text}</div>;
  })
})

function monthToNum(datestr:any){
  datestr = datestr.replace("Janurary", "01")
  datestr = datestr.replace("February", "02")
  datestr = datestr.replace("March", "03")
  datestr = datestr.replace("April", "04")
  datestr = datestr.replace("May", "05")
  datestr = datestr.replace("June", "06")
  datestr = datestr.replace("July", "07")
  datestr = datestr.replace("August", "08")
  datestr = datestr.replace("September", "09")
  datestr = datestr.replace("October", "10")
  datestr = datestr.replace("November", "11")
  datestr = datestr.replace("December", "12")
  return datestr
}

const sorter = (colName:string) => {
  if (colName === "Dates"){
    return (a:any, b:any) => {
      const x = monthToNum(a[colName][0].text);
      const y = monthToNum(b[colName][0].text);
      return x > y ? -1 : x < y ? 1 : 0;
    }
  }
}

function App() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<{string: HTRecord[]}>>([])
  const [dateSort, setDateSort] = useState<"ascend"|"descend"|null>("ascend")

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
      width: 260,
      fixed: colName === "Cruise",
      render: (record: any) => <Cell record={record} />,
      sorter: sorter(colName),
      sortOrder: colName === "Dates" ? dateSort: undefined,
      filters: [
        {text: "Final", value: "final"},
        {text: "Submitted", value: "preliminary"},
        {text: "Not Received", value: "not_yet"},
      ],
      onFilter: (value:any, record:any) => {
        const col = record[colName]

        if (col === undefined){
          return false
        }

        for (let i = 0; i < col.length; i++){
          let item = col[i];
          if (item.status !== null && item.status.includes(value)){
            return true
          }
        }
        return false
      }
    }
  })

  return (
    <div className="App">
      <button onClick={()=> downloadXLS(columns, rows)}>Download XLSX</button>
      <Table 
      columns={tableCols} 
      dataSource={rows} 
      size="small"
      scroll={{ x: tableCols.reduce((accum, current) => accum + current.width, 0) }} 
      sticky 
      pagination={false}
      onChange={(pagination, filters, sorter) => setDateSort((sorter as any).order)}/> 
    </div>
  );
}

export default App;
