import React, { useEffect, useState, memo } from 'react';
import { Table, Tag, Button, Drawer } from 'antd';
import XLSX from "xlsx"
import 'antd/dist/antd.css';

const colWidth = 260;

interface HTRecord {
  text: string | number | null;
  href: string | null;
  status: string | null;
}

const checkWidth = () => {
  return window.innerWidth > colWidth * 2.5;
}

const TagDefs = () => {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <Button shape="round" onClick={() => setVisible(true)}>Status Definitions</Button>
      <Drawer
        title="Status Definitions"
        placement="left"
        visible={visible}
        onClose={() => setVisible(false)}
      >
        <dl>
          <dt><Tag color="green">Final</Tag></dt>
          <dd>Data are received and merged into the dataset or available at the linked location, with no expected updates for this parameter.</dd>
          <dt><Tag color="green">Preliminary</Tag></dt>
          <dd>Data are received and merged into the dataset or available at the linked location, with expected updates for this parameter (e.g. post cruise calibration).</dd>
          <dt><Tag color="yellow">Final</Tag></dt>
          <dd>Data are received and available as is, with no expected updates. Merging into the dataset is pending.</dd>
          <dt><Tag color="yellow">Preliminary</Tag></dt>
          <dd>Data are received and available as is, with expected updates. Merging into the dataset is pending.</dd>
          <dt><Tag color="red">Funded</Tag></dt>
          <dd>Samples for this parameter have been collected. Analytical results are expected within the timelines set by GO-SHIP.</dd>
          <dt><Tag color="red">Unfunded</Tag></dt>
          <dd>Samples for this parameter have been collected, but no funds are available for analysis. These data are not expected to be received.</dd>
        </dl>
      </Drawer>
    </>
  )
}

const downloadXLS = (columns: string[], rows: Array<{ [key: string]: HTRecord[] }>) => {
  const sortedRows = rows.sort(sorter("Dates"))
  let expocodeLinks: { [key: string]: string } = {}

  const data = sortedRows.map((row, rowIndex) => {
    return columns.map((col, colIndex) => {
      let cell = row[col]
      if (cell === undefined) {
        return undefined
      }

      // Check if the column we are looking at is the expocode and store a link
      // Since we need to modify the cell properties, most of this is calculating the cell address in "excel" format
      cell.forEach(rec => {
        if (col.includes("Expocode") && rec.href !== null) {
          let colLetter = String.fromCharCode(colIndex + 'A'.charCodeAt(0))
          let cellAddress = `${colLetter}${rowIndex + 2}`
          expocodeLinks[cellAddress] = rec.href
        }
      })

      let cell_text = cell.map((data: HTRecord) => data.text).join("; ")
      return cell_text
    })
  })
  const workbook = XLSX.utils.book_new()
  const hydrotable = XLSX.utils.aoa_to_sheet([columns, ...data])

  // Make the expocode cells a link
  Object.entries(expocodeLinks).forEach(([address, href]) => hydrotable[address].l = { Target: href, Tooltip: "Goto CCHDO Cruise page" })

  XLSX.utils.book_append_sheet(workbook, hydrotable, "Hydrotable")

  let not_received_data: Array<[string, string, string]> = []
  sortedRows.forEach((row) => {
    let cruise = row["Cruise"][0].text
    return columns.forEach((col) => {
      let cell = row[col]
      if (cell === undefined) {
        return undefined
      }
      cell.forEach((rec: HTRecord) => {
        if (rec.status !== null && rec.status.includes("not_yet")) {
          not_received_data.push([rec.text as string, col, cruise as string])
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
    if (item.status !== null && item.status.includes("final")) {
      final = <Tag color="green">Received</Tag>
    }
    if (item.status !== null && item.status.includes("preliminary")) {
      preliminary = <Tag color="yellow">Submitted</Tag>
    }
    if (item.status !== null && item.status.includes("not_yet")) {
      notyet = <Tag color="red">Not Received</Tag>
    }
    if (item.href !== null) {
      return <div>{final}{preliminary}{notyet} <a href={item.href}>{item.text}</a></div>
    }
    return <div>{final}{preliminary}{notyet} {item.text}</div>;
  })
})

function monthToNum(datestr: string) {
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

const sorter = (colName: string) => {
  if (colName === "Dates") {
    return (a: any, b: any) => {
      const x = monthToNum(a[colName][0].text);
      const y = monthToNum(b[colName][0].text);
      return x > y ? -1 : x < y ? 1 : 0;
    }
  }
}

const filterable = (colName: string, rows: Array<{ [key: string]: HTRecord[] }>) => {
  let filterTerms = ["final", "preliminary", "not_yet"]
  let cells = rows.map((row) => row[colName]).flat().filter((value) => value !== undefined)
  let canFilter = cells.some((value) => filterTerms.some(term => value.status !== null && value.status.includes(term)))
  return canFilter
}

function App() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<{ string: HTRecord[] }>>([])
  const [dateSort, setDateSort] = useState<"ascend" | "descend" | null>("ascend")
  const [loading, setLoading] = useState(true)
  const [fixedCol, setFixedCol] = useState(checkWidth())

  useEffect(() => {
    (async () => {
      const data = await fetch("https://hydrotable.cchdo.io/hydrotable/json")
      const parsed = await data.json()
      setColumns(parsed.columns)
      setRows(parsed.rows)
      setLoading(false)
    })()
  }, []);
  useEffect(() => {
    window.addEventListener("resize", () => {
      if (checkWidth()) {
        setFixedCol(true)
      } else {
        setFixedCol(false)
      }
    })
  }, [])

  const tableCols = columns.map((colName) => {
    let canFilter = filterable(colName, rows)
    return {
      title: colName,
      dataIndex: colName,
      key: colName,
      width: colWidth,
      fixed: colName === "Cruise" && fixedCol,
      render: (record: any) => <Cell record={record} />,
      sorter: sorter(colName),
      sortOrder: colName === "Dates" ? dateSort : undefined,
      filters: canFilter ? [
        { text: "Received", value: "final" },
        { text: "Submitted", value: "preliminary" },
        { text: "Not Received", value: "not_yet" },
      ] : undefined,
      onFilter: (value: any, record: any) => {
        const col = record[colName]

        if (col === undefined) {
          return false
        }

        for (let i = 0; i < col.length; i++) {
          let item = col[i];
          if (item.status !== null && item.status.includes(value)) {
            return true
          }
        }
        return false
      }
    }
  })

  return (
    <div className="App">
      <Button disabled={loading} type="primary" shape="round" onClick={() => downloadXLS(columns, rows)}>Download XLSX</Button>
      <TagDefs />
      <Table
        loading={loading}
        columns={tableCols}
        dataSource={rows}
        size="small"
        scroll={{ x: tableCols.reduce((accum, current) => accum + current.width, 0) }}
        sticky
        pagination={false}
        onChange={(pagination, filters, sorter) => setDateSort((sorter as any).order)} />
    </div>
  );
}

export default App;
