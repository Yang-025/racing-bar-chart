import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as R from "ramda";
import "./App.css";
import handleCsv from "./datahandle";
import useInterval from "./hooks/useInterval";

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
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const initTickDuration = 1000;
  const [tickDuration, setTickDuration] = useState(null);

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.number)])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleBand()
    .paddingOuter(0.1)
    .paddingInner(0.1)
    .domain(data.map((d, i) => d.rank))
    .range([margin.top, height - margin.bottom]);

  const xAxis = d3.axisTop().scale(xScale);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${margin.top})`)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .call(xAxis);


    /* *************** 接資料 *************** */
    handleCsv().then(res => {
      console.log(res);
    });

  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.style("width", width).style("height", height);

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(["A", "B", "C", "D", "E"]);

    /* *************** 長條 *************** */
    svg
      .selectAll("rect")
      .data(data, d => d.name)
      .join("rect")
      .attr("fill-opacity", 0.6)
      .attr("x", xScale(0))
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.name))
      .transition()
      .ease(d3.easeLinear)
      .duration(tickDuration)
      .attr("y", d => yScale(d.rank))
      .attr("width", d => xScale(d.number) - xScale(0));
    /* *************** 長條 END *************** */

    /* *************** 隊伍名稱 *************** */
    svg
      .selectAll("text.teamname")
      .data(data, d => d.name)
      .join("text")
      .attr("fill-opacity", 0.7)
      .attr("class", "teamname")
      .attr("font-weight", "bold")
      .style("text-anchor", "end")
      .style("dominant-baseline", "middle")
      .text(d => d.name)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", d => xScale(d.number) - 6)
      .attr("y", d => yScale(d.rank) + yScale.bandwidth() / 2);
    /* *************** 隊伍名稱 END *************** */

    /* *************** 隊伍勝場 *************** */
    svg
      .selectAll("text.teamvalue")
      .data(data, d => d.name)
      .join("text")
      .attr("class", "teamvalue")
      .attr("dy", "20")
      .style("text-anchor", "end")
      .style("dominant-baseline", "middle")
      .text(d => d.number)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .attr("x", d => xScale(d.number) - 6)
      .attr("y", d => yScale(d.rank) + yScale.bandwidth() / 2)
      .tween("text", function(d) {
        let i = d3.interpolateRound(d.last_number || d.number, d.number);
        return function(t) {
          this.textContent = d3.format(",")(i(t));
        };
      });
    /* *************** 隊伍勝場 END *************** */

    /* *************** x軸 *************** */
    svg
      .selectAll(".xAxis")
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .call(xAxis);
    /* *************** x軸 END *************** */
  }, [data, svgRef.current]);

  function updateDataset() {
    const updatedData = data.map(d => {
      return {
        ...d,
        number: d.number + Math.floor(Math.random() * Math.floor(200)),
        last_number: d.number
      };
    });

    setData(rankData(updatedData));
  }

  useInterval(() => {
    updateDataset();
  }, tickDuration);

  return (
    <div className="app">
      <div>
        <h3>{`svg ${width}* ${height}`}</h3>
        <svg ref={svgRef} />
        <div>
          {/* 手動  const [tickDuration, setTickDuration] = useState(initTickDuration); */}
          {/* <button onClick={updateDataset}>測試</button> */}
          {/* 自動 */}
          <button onClick={() => setTickDuration(initTickDuration)}>
            測試
          </button>
          <button onClick={() => setTickDuration(null)}>停止</button>
        </div>
      </div>
    </div>
  );
}

export default App;
