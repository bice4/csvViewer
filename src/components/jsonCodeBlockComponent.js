import { CopyBlock, dracula } from "react-code-blocks";
import React from "react";
import { Divider } from "primereact/divider";

function JsonCodeBlockComponent({ props }) {
  if (!props.isCompiled) return null;

  return (
    <div className="grid">
      <Divider />
      <div className="col-10 col-offset-1">
        <div className="p-1">
          <CopyBlock
            text={props.data}
            language="jsx"
            theme={dracula}
            showLineNumbers={true}
            wrapLongLines={true}
          />
        </div>
      </div>
    </div>
  );
}

export default JsonCodeBlockComponent;
