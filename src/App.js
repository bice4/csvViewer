import { useState } from "react";
import Papa from "papaparse";
import packageJson from "../package.json";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { CopyBlock, dracula } from "react-code-blocks";
import { InputTextarea } from "primereact/inputtextarea";
import { ScrollTop } from "primereact/scrolltop";
import { Divider } from "primereact/divider";

function App() {
  const [csvRaw, setCsvRaw] = useState("");
  const [csvData, setCsvData] = useState([]);

  const [csvParseError, setCsvParseError] = useState("");
  const [isCsvError, setIsCsvError] = useState(false);

  const [headerNameArray, setHeaderNameArray] = useState([]);

  const [isSortable, setIsSortable] = useState(false);
  const [isPaginator, setIsPaginator] = useState(false);
  const [isJsonCodeBlock, setIsJsonCodeBlock] = useState(false);

  const [isTableOptionsDisabled, setIsTableOptionsDisabled] = useState(false);

  // Parse CSV data from input
  const setCsvRawDataFromInput = (rawData) => {
    console.log("Version: " + packageJson.version);

    if (rawData.length === 0) {
      setCsvRaw("");
      setCsvData([]);
      setHeaderNameArray([]);
      setIsCsvError(false);
      setIsTableOptionsDisabled(false);
      return;
    }

    setCsvRaw(rawData);

    // If CSV is empty, return
    if (rawData.length === 0) return;

    // Parse CSV data
    Papa.parse(rawData, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        console.log(results);

        // If CSV is invalid, set error message and return
        if (results.errors.length > 0) {
          setIsCsvError(true);
          setCsvParseError(results.errors[0].message);
          setCsvData([]);
          setHeaderNameArray([]);
          setIsTableOptionsDisabled(true);
          return;
        } else {
          // If CSV is valid, set data and header name array
          setCsvData(results.data);
          setIsCsvError(false);
          setHeaderNameArray(results.meta.fields);
          setIsTableOptionsDisabled(false);
        }
      },
    });
  };

  // Render the app
  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl">CSV Viewer</h1>
        <div className="grid">
          <div className="col">
            <div className="text-center p-6">
              <InputTextarea
                value={csvRaw}
                rows={9}
                cols={150}
                style={{ resize: "none" }}
                onChange={(e) => setCsvRawDataFromInput(e.target.value)}
              />
            </div>
          </div>
        </div>
        {renderTableOptions()}
        {renderErrorText()}
        {renderTable()}
      </div>
      {renderJsonCodeBlock()}
      <Divider />
      <ScrollTop />
      <div className="grid">
        <div className="col">
          <div className="text-center p-4">
            Version: {packageJson.version}
            <br />
            Created by RB by DED 2023
          </div>
        </div>
      </div>
    </div>
  );

  // Render table if CSV is valid and has data to display
  function renderTable() {
    if (isCsvError) return null;
    if (headerNameArray.length === 0) return null;
    if (csvData.length === 0) return null;

    const columns = [];

    for (let i = 0; i < headerNameArray.length; i++) {
      columns.push(
        <Column
          key={i}
          field={headerNameArray[i]}
          header={headerNameArray[i]}
          sortable={isSortable}
        />
      );
    }

    if (isPaginator) {
      return (
        <div className="grid">
          <div className="col">
            <div className="text-center p-4">
              <DataTable
                showGridlines
                value={csvData}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
              >
                {columns}
              </DataTable>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid">
          <div className="col">
            <div className="text-center p-4">
              <DataTable showGridlines value={csvData}>
                {columns}
              </DataTable>
            </div>
          </div>
        </div>
      );
    }
  }

  // Render JSON code block if user wants to convert CSV to JSON format
  function renderJsonCodeBlock() {
    if (isJsonCodeBlock === false) return null;
    if (isCsvError) return null;
    if (headerNameArray.length === 0) return null;
    if (csvData.length === 0) return null;

    const json = JSON.stringify(csvData, null, 2);

    return (
      <div className="grid">
        <Divider />
        <div className="col-10 col-offset-1">
          <div className=" p-2">
            <CopyBlock
              text={json}
              language="jsx"
              theme={dracula}
              showLineNumbers={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render table options, such as sortable, paginator, and convert to JSON
  function renderTableOptions() {
    return (
      <div className="flex flex-wrap justify-content-center gap-3">
        <div className="flex align-items-center">
          <Checkbox
            inputId="sortable"
            onChange={(e) => setIsSortable(e.checked)}
            checked={isSortable}
            disabled={isTableOptionsDisabled}
          />
          <label htmlFor="sortable" className="ml-2">
            Sortable
          </label>
        </div>
        <div className="flex align-items-center">
          <Checkbox
            inputId="paginator"
            onChange={(e) => setIsPaginator(e.checked)}
            checked={isPaginator}
            disabled={isTableOptionsDisabled}
          />
          <label htmlFor="paginator" className="ml-2">
            Paginator
          </label>
        </div>
        <div className="flex align-items-center">
          <Checkbox
            inputId="jsonBlock"
            onChange={(e) => setIsJsonCodeBlock(e.checked)}
            checked={isJsonCodeBlock}
            disabled={isTableOptionsDisabled}
          />
          <label htmlFor="jsonBlock" className="ml-2">
            Convert to JSON
          </label>
        </div>
      </div>
    );
  }

  // Render error text if CSV is invalid
  function renderErrorText() {
    if (!isCsvError) return null;
    return (
      <div style={{ marginTop: 20 }}>
        <div className="text-center text-3xl text-red-500">
          Error parsing CSV
        </div>
        <div className="text-center text-2xl text-red-500">{csvParseError}</div>
      </div>
    );
  }
}

export default App;
