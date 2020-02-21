import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import "./App.css";

function App() {
  const svgRef = useRef();
  const data = [10, 20, 30, 40, 50];
  const width = 800;
  const height = 650;
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.style("width", width).style("height", height);

    svg
      .selectAll("rect")
      .data(data, d => d)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 50)
      .attr("width", d => d)
      .attr("height", 50)
      .attr("fill", "DarkBlue");
  }, [data, svgRef.current]);

  return (
    <div className="app">
      <div>
        <h3>{`svg ${width}* ${height}`}</h3>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}

export default App;
