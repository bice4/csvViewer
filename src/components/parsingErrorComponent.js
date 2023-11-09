import React from "react";

function ParsingErrorComponent({ props }) {
  if (!props.isError) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <div className="text-center text-3xl text-red-500">Error parsing CSV</div>
      <div className="text-center text-2xl text-red-500">
        {props.message}
      </div>
    </div>
  );
}

export default ParsingErrorComponent;
