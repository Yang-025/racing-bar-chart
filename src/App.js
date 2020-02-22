import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as R from "ramda";
import "./App.css";

function rankData(data) {
  const sortUpdatedData = R.sortWith([R.descend(R.prop("number"))])(data);

  const addRankDataset = sortUpdatedData.map((d, i) => {
    return { ...d, rank: i + 1 };
  });
  return addRankDataset;
}

function App() {
  const svgRef = useRef();
  const randomData = [
    {
      name: "A",
      number: 10
    },
    {
      name: "B",
      number: 20
    },
    {
      name: "C",
      number: 30
    },
    {
      name: "D",
      number: 40
    },
    {
      name: "E",
      number: 50
    }
  ];
  const [data, setData] = useState(rankData(randomData));
  const width = 800;
  const height = 650;

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.style("width", width).style("height", height);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.number)])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .paddingOuter(0.1)
      .paddingInner(0.1)
      .domain(data.map((d, i) => d.rank))
      .range([0, height]);

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(["A", "B", "C", "D", "E"]);
    svg
      .selectAll("rect")
      .data(data, d => d.name)
      .join("rect")
      .attr("x", xScale(0))
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.name))
      .transition()
      .ease(d3.easeLinear)
      .duration(500)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.number) - xScale(0));

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
                return {
                  ...d,
                  number: d.number + Math.floor(Math.random() * Math.floor(200))
                };
              });

              setData(rankData(updatedData));
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
