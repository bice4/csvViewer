/* eslint-disable no-useless-concat */
import React, { useState, useRef } from "react";
import Papa from "papaparse";
import packageJson from "../package.json";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from "primereact/inputtextarea";
import { ScrollTop } from "primereact/scrolltop";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { save } from "save-file";
import ParsingErrorComponent from "./components/parsingErrorComponent";
import JsonCodeBlockComponent from "./components/jsonCodeBlockComponent";

function App() {
  const paginationThreshold = 30;
  const maxFileSize = 10000000;
  const maxJsonRecords = 100;

  const [csvRaw, setCsvRaw] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [file, setFile] = useState(null);
  let fileUploadRef = useRef(null);
  const toast = useRef(null);

  const [parsingError, setParsingError] = useState({
    isError: false,
    message: "",
  });

  const [headerNameArray, setHeaderNameArray] = useState([]);

  const [isSortable, setIsSortable] = useState(false);
  const [isReordable, setIsReordable] = useState(false);

  const [selectedObjs, setSelectedObjs] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [jsonCodeBlockData, setJsonCodeBlockData] = useState({
    isCompiled: false,
    data: "",
  });

  const [disableStringInput, setDisableStringInput] = useState(false);
  const [disableFileInput, setDisableFileInput] = useState(false);

  // JSON convert options for speed dial
  const jsonConvertOptions = [
    {
      label: "None",
      icon: "pi pi-ban",
      command: () => {
        setJsonCodeBlockData({ isCompiled: false, data: "" });
      },
    },
    {
      label: "Selected json",
      icon: "pi pi-image",
      command: () => {
        if (selectedObjs.length === 0) {
          toast.current.show({
            severity: "warn",
            summary: "Warning",
            detail: "Please select a row.",
            life: 3000,
          });
          return;
        }
        setJsonCodeBlockData({
          isCompiled: true,
          data: JSON.stringify(selectedObjs, null, 2),
        });
      },
    },
    {
      label: "All to json",
      icon: "pi pi-images",
      command: async () => {
        if (csvData.length > maxJsonRecords) {
          await save(JSON.stringify(csvData, null, 2), "csv.json");
          setJsonCodeBlockData({ isCompiled: false, data: "" });
        } else {
          setJsonCodeBlockData({
            isCompiled: true,
            data: JSON.stringify(csvData, null, 2),
          });
        }
      },
    },
    {
      label: "All to excel",
      icon: "pi pi-book",
      command: async () => {
        exportExcel();
      },
    },
    {
      label: "Create C# model",
      icon: "pi pi-microsoft",
      command: async () => {
        toCsharp();
      },
    },
  ];

  // Start processing CSV data
  const process = async () => {
    if (csvRaw.length !== 0) processInputCsvData();

    if (file !== null) processFile();
  };

  // Process results from PapaParse
  function processResult(results) {
    if (results.errors?.length !== 0) {
      setParsingError({ isError: true, message: results.errors[0].message });

      setCsvData([]);
      setHeaderNameArray([]);

      return;
    }

    if (!results.data?.length) {
      setParsingError({ isError: true, message: "Parsed CSV data is empty" });
      return;
    }

    setCsvData(results.data);
    setParsingError({ isError: false, message: "" });
    setHeaderNameArray(results.meta.fields);
  }

  const toCsharp = () => {
    let csharp = `public class CsvModel` + "\n";
    csharp += "{" + "\n";

    var element = csvData[0];

    for (let i = 0; i < Object.keys(element).length; i++) {
      csharp +=
        "   public string " + Object.keys(element)[i] + " { get; set; }" + "\n";
    }

    csharp += "}";

    setJsonCodeBlockData({
      isCompiled: true,
      data: csharp,
    });
  };

  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(csvData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "products");
    });
  };

  const saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };

  // Process CSV data from input text area
  async function processInputCsvData() {
    if (csvRaw.length === 0) return;

    if (file !== null) {
      setFile(null);
      fileUploadRef.clear();
    }

    setIsProcessing(true);
    setJsonCodeBlockData({ isCompiled: false, data: "" });

    // Parse CSV data
    let results = Papa.parse(csvRaw, {
      header: true,
      skipEmptyLines: true,
    });

    processResult(results);
    setIsProcessing(false);
  }

  // Process CSV data from file upload
  async function processFile() {
    if (file === null) return;

    if (csvRaw.length !== 0) {
      setCsvRaw("");
      setHeaderNameArray([]);
      setParsingError({ isError: false, message: "" });
    }

    setIsProcessing(true);
    setJsonCodeBlockData({ isCompiled: false, data: "" });

    // Parse CSV data
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results, file) {
        processResult(results);

        setIsProcessing(false);
      },
    });
  }

  // Clear file upload component
  function clearFile() {
    setFile(null);
    fileUploadRef.clear();
  }

  // Callback function for input text area
  const inputStringCallback = async (event) => {
    if (event.length === 0 && csvRaw.length === 0) return;
    setFile(null);
    fileUploadRef.clear();
    setCsvRaw(event);
    setDisableFileInput(true);
  };

  // Callback function for file upload component
  const selectFileCallback = async (event) => {
    if (event.files?.length === 0) return;
    if (event.files[0].type !== "text/csv") {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Invalid file type. Please select a CSV file.",
        life: 3000,
      });

      clearFile();

      return;
    }

    if (event.files[0].size > maxFileSize) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "File size is too large. Please select a file less than 10MB.",
        life: 3000,
      });

      clearFile();

      return;
    }

    setFile(event.files[0]);
    setDisableStringInput(true);
  };

  // Clear CSV data and reset all states to default
  const clearCsvData = async () => {
    setCsvRaw("");
    setCsvData([]);
    setHeaderNameArray([]);
    setIsProcessing(false);
    setParsingError({ isError: false, message: "" });
    setJsonCodeBlockData({ isCompiled: false, data: "" });
    clearFile();
    setDisableStringInput(false);
    setDisableFileInput(false);
    setSelectedObjs([]);
  };

  // File upload component options
  const chooseOptions = {
    icon: "pi pi-fw pi-images",
    iconOnly: false,
    label: "Select file",
    className: "custom-choose-btn p-button-rounded p-button-outlined",
  };

  // Render the app
  return (
    <div>
      <Toast ref={toast} />
      <div className="text-center">
        <h1 className="text-4xl">CSV Viewer</h1>
        <div className="grid">
          <div className="col">
            <div className="text-center p-6">
              <Splitter style={{ height: "300px" }}>
                <SplitterPanel className="flex align-items-center justify-content-center">
                  <div style={{ padding: 30 }}>
                    <InputTextarea
                      value={csvRaw}
                      rows={9}
                      disabled={disableStringInput}
                      cols={90}
                      style={{ resize: "none" }}
                      onChange={(e) => inputStringCallback(e.target.value)}
                    />
                  </div>
                </SplitterPanel>
                <SplitterPanel className="flex align-items-center justify-content-center">
                  <FileUpload
                    ref={(ref) => (fileUploadRef = ref)}
                    accept="text/*"
                    mode="basic"
                    customUpload
                    chooseOptions={chooseOptions}
                    onSelect={selectFileCallback}
                    maxFileSize={10000000}
                    disabled={disableFileInput}
                  />
                </SplitterPanel>
              </Splitter>
            </div>
          </div>
        </div>
        {renderButtons()}
        <br />
        {renderProcessingSpinner()}
        <ParsingErrorComponent props={parsingError} />
      </div>
      {renderTable()}
      {renderJsonOptions()}
      <JsonCodeBlockComponent props={jsonCodeBlockData} />
      <Divider />
      <ScrollTop />
      <div className="grid">
        <div className="col">
          <div className="text-center p-4">
            Version: {packageJson.version}
            <br />
            Created by RB by DED 2023
            <br />
            <br />
            <Button
              onClick={() => {
                window.open("https://github.com/bice4/csvViewer");
              }}
              rounded
              text
              aria-label="Filter"
              id="github-button"
              icon="pi pi-github"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render processing spinner
  function renderProcessingSpinner() {
    if (!isProcessing) return null;
    return <ProgressSpinner />;
  }

  // Render buttons for rendering CSV and clearing CSV data
  function renderButtons() {
    return (
      <div className="flex flex-wrap justify-content-center gap-5">
        <div className="flex align-items-center">
          <Button
            icon="pi pi-eye"
            onClick={process}
            tooltip="Render CSV"
            tooltipOptions={{ position: "top" }}
          />
        </div>
        <div className="flex align-items-center">
          <Button
            icon="pi pi-trash"
            onClick={clearCsvData}
            tooltip="Clear CSV data"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      </div>
    );
  }

  // Render JSON convert options
  function renderJsonOptions() {
    if (csvData.length === 0) return null;
    return (
      <div style={{ position: "relative", height: "64px", marginLeft: "15px" }}>
        <Tooltip
          target=".speeddial-bottom-left .p-speeddial-action"
          position="bottom"
        />
        <SpeedDial
          model={jsonConvertOptions}
          direction="right"
          className="speeddial-bottom-left left-0 bottom-0"
          showIcon="pi pi-box"
          hideIcon="pi pi-times"
        />
      </div>
    );
  }

  function renderTableOptions() {
    return (
      <div className="flex justify-content-center flex-wrap">
        <div className="flex align-items-center justify-content-center p-3">
          <Checkbox
            inputId="sortable"
            onChange={(e) => setIsSortable(e.checked)}
            checked={isSortable}
          />
          <label
            htmlFor="sortable"
            className="ml-2"
            style={{ display: "inline-block" }}
          >
            Sortable
          </label>
        </div>
        <div className="flex align-items-center justify-content-center p-3">
          <Checkbox
            inputId="reordable"
            onChange={(e) => setIsReordable(e.checked)}
            checked={isReordable}
          />
          <label
            htmlFor="reordable"
            className="ml-2"
            style={{ display: "block" }}
          >
            Reordable
          </label>
        </div>
        <br />
      </div>
    );
  }

  // Render table if CSV is valid and has data to display
  function renderTable() {
    if (
      parsingError.isError ||
      headerNameArray.length === 0 ||
      csvData.length === 0
    )
      return null;

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

    // Render table with pagination if CSV data is large
    if (csvData.length > paginationThreshold) {
      return (
        <div style={{ padding: 20 }}>
          {renderTableOptions()}
          <DataTable
            value={csvData}
            scrollable
            scrollHeight="800px"
            tableStyle={{ minWidth: "50rem" }}
            showGridlines
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 30, 50]}
            selectionMode="multiple"
            selection={selectedObjs}
            onSelectionChange={(e) => setSelectedObjs(e.value)}
            metaKeySelection={false}
            reorderableColumns={isReordable}
            reorderableRows={isReordable}
          >
            {columns}
          </DataTable>
        </div>
      );
    }
    return (
      <div style={{ padding: 20 }}>
        {renderTableOptions()}

        <DataTable
          value={csvData}
          showGridlines
          scrollable
          scrollHeight="800px"
          tableStyle={{ minWidth: "50rem" }}
          selectionMode="multiple"
          selection={selectedObjs}
          onSelectionChange={(e) => setSelectedObjs(e.value)}
          metaKeySelection={false}
          reorderableColumns={isReordable}
          reorderableRows={isReordable}
        >
          {columns}
        </DataTable>
      </div>
    );
  }
}

export default App;
