import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as R from "ramda";
import "./App.css";

function App() {
  const svgRef = useRef();
  const randomData = [10, 20, 30, 40, 50];
  const [data, setData] = useState(randomData);
  const width = 800;
  const height = 650;
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.style("width", width).style("height", height);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d)])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .paddingOuter(0.1)
      .paddingInner(0.1)
      .domain(data.map((d, i) => i))
      .range([0, height]);

    svg
      .selectAll("rect")
      .data(data, d => d)
      .join("rect")
      .attr("x", xScale(0))
      .attr("y", (d, i) => yScale(i))
      .attr("width", d => xScale(d) - xScale(0))
      .attr("height", yScale.bandwidth())
      .attr("fill", "DarkBlue");
  }, [data, svgRef.current]);

  return (
    <div className="app">
      <div>
        <h3>{`svg ${width}* ${height}`}</h3>
        <svg ref={svgRef} />
        <div>
          <button
            onClick={() => {
              const updatedData = data.map(d => {
                return d + Math.floor(Math.random() * Math.floor(10));
              });

              const sortUpdatedData = R.sort((a, b) => b - a)(updatedData);
              setData(sortUpdatedData);
            }}
          >
            測試
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
