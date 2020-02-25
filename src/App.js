import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as R from "ramda";
import "./App.css";
import handleCsv from "./datahandle";
import useInterval from "./hooks/useInterval";

function App() {
  const mode = "auto";
  const svgRef = useRef();
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [timeSeriesList, setTimeSeriesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState([]);
  const width = 800;
  const height = 650;
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const initTickDuration = 1000;
  const [tickDuration, setTickDuration] = useState(
    mode === "manual" ? initTickDuration : null
  );

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

  const xAxis = d3.axisTop().ticks(5).scale(xScale);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    /* *************** x軸 *************** */
    svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${margin.top})`)
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .call(xAxis);
    /* *************** x軸 END *************** */

    /* *************** 顯示年月 *************** */
    svg
      .append("text")
      .attr("class", "yearText")
      .attr("x", width - margin.right)
      .attr("y", height - margin.bottom - 20)
      .style("text-anchor", "end")
      .style("font-size", `20px`)
      .text("");
    /* *************** 顯示年月 END *************** */

    /* *************** 接資料 *************** */
    handleCsv().then(res => {
      console.log(res);
      setTimeSeriesData(res);
      setTimeSeriesList(R.keys(res));
      setData(R.values(res)[currentIndex]);
    });
    /* *************** 接資料 END *************** */
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

    /* *************** 更新年月 *************** */
    if (timeSeriesList.length > 0) {
      d3.selectAll("text.yearText").text(timeSeriesList[currentIndex]);
    }
    /* *************** 更新年月 END *************** */
  }, [data, svgRef.current]);

  function updateDataset() {
    const next = currentIndex + 1;
    if (next >= timeSeriesList.length) {
      console.log("結束了");
      setTickDuration(null);
    } else {
      setCurrentIndex(next);
      setData(R.values(timeSeriesData)[next]);
    }
  }

  useInterval(() => {
    mode === "auto" && updateDataset();
  }, tickDuration);

  return (
    <div className="app">
      <div>
        <h3>{`svg ${width}* ${height}`}</h3>
        <svg ref={svgRef} />
        <div>
          {mode === "manual" ? (
            <div>
              <button onClick={updateDataset}>手動測試</button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  if (currentIndex === timeSeriesList.length - 1) {
                    setCurrentIndex(0);
                  }
                  setTickDuration(initTickDuration);
                }}
              >
                測試
              </button>
              <button onClick={() => setTickDuration(null)}>停止</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
