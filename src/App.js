import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import * as R from "ramda";
import "./App.css";
import handleCsv from "./datahandle";
import useInterval from "./hooks/useInterval";

function App() {
  // manual || auto
  const mode = "manual";
  const svgRef = useRef();
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [timeSeriesList, setTimeSeriesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState([]);
  const width = 800;
  const height = 650;
  const margin = { top: 30, right: 30, bottom: 30, left: 30 };
  const topN = 10;
  const initTickDuration = 1000;
  const [tickDuration, setTickDuration] = useState(
    mode === "manual" ? initTickDuration : null
  );
  const [prevStats, setPrevStats] = useState(null);
  const [nextStats, setNextStats] = useState(null);

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

  const xAxis = d3
    .axisTop()
    .ticks(5)
    .scale(xScale);

  // 先整理出隊伍上個月和下個月的資料Mapping
  function handlePrevAndNext(data) {
    const nameframes = R.pipe(
      R.chain(R.flatten),
      R.groupBy(R.prop("name"))
    )(R.values(data));

    let prevMap = new Map();
    let nextMap = new Map();
    R.map(frames => {
      frames.forEach((frame, index) => {
        if (index === 0) {
          prevMap.set(frame, frame);
        } else {
          prevMap.set(frame, frames[index - 1]);
        }
      });
    })(R.values(nameframes));

    R.map(frames => {
      frames.forEach((frame, index) => {
        if (index === frames.length - 1) {
          nextMap.set(frame, frame);
        } else {
          nextMap.set(frame, frames[index + 1]);
        }
      });
    })(R.values(nameframes));

    return [prevMap, nextMap];
  }

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
      const [prevMap, nextMap] = handlePrevAndNext(res);
      setPrevStats(prevMap);
      setNextStats(nextMap);
      filterData(R.values(res)[currentIndex]);
    });
    /* *************** 接資料 END *************** */
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.style("width", width).style("height", height);

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain([
        "Dallas Mavericks",
        "Denver Nuggets",
        "Golden State Warriors",
        "Houston Rockets",
        "Los Angeles Clippers",
        "Los Angeles Lakers",
        "Memphis Grizzlies",
        "Minnesota Timberwolves",
        "New Orleans Pelicans",
        "Oklahoma City Thunder",
        "Phoenix Suns",
        "Portland Trail Blazers",
        "Sacramento Kings",
        "San Antonio Spurs",
        "Utah Jazz"
      ]);

    /* *************** 長條 *************** */
    svg
      .selectAll("rect")
      .data(data, d => d.name)
      .join(
        enter =>
          enter
            .append("rect")
            .attr("width", d => {
              let prevNumber = prevStats.get(d).number;
              return xScale(prevNumber) - xScale(0);
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2),
        update => update,
        exit =>
          exit
            .transition()
            .ease(d3.easeLinear)
            .duration(tickDuration)
            .attr("width", d => {
              let nextNumber = nextStats.get(d).number;
              return xScale(nextNumber) - xScale(0);
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2)
            .remove()
      )
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
      .join(
        enter =>
          enter
            .append("text")
            .attr("x", d => {
              let prevNumber = prevStats.get(d).number;
              return xScale(prevNumber) - 6;
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2),
        update => update,
        exit =>
          exit
            .transition()
            .ease(d3.easeLinear)
            .duration(tickDuration)
            .attr("x", d => {
              let nextNumber = nextStats.get(d).number;
              return xScale(nextNumber) - 6;
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2)
            .remove()
      )
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
      .join(
        enter =>
          enter
            .append("text")
            .attr("x", d => {
              let prevNumber = prevStats.get(d).number;
              return xScale(prevNumber) - 6;
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2),
        update => update,
        exit =>
          exit
            .transition()
            .ease(d3.easeLinear)
            .duration(tickDuration)
            .attr("x", d => {
              let nextNumber = nextStats.get(d).number;
              return xScale(nextNumber) - 6;
            })
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2)
            .remove()
      )
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

    /* ******************** 隊伍LOGO ******************** */
    svg
      .selectAll("image")
      .data(data, d => d.name)
      .join(
        enter =>
          enter
            .append("image")
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2),
        update => update,
        exit =>
          exit
            .transition()
            .ease(d3.easeLinear)
            .duration(tickDuration)
            .attr("y", () => yScale(topN) + yScale.bandwidth() * 2)
            .remove()
      )
      .attr("xlink:href", d => `/teams/${d.name}.gif`)
      .attr("width", yScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .transition()
      .duration(tickDuration)
      .ease(d3.easeLinear)
      .style("fill-opacity", 1)
      .attr("x", xScale(0) - 30)
      .attr("y", d => yScale(d.rank));
    /* ******************** 隊伍LOGO ******************** */

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

  function filterData(data) {
    setData(R.slice(0, topN, data));
  }

  function updateDataset() {
    const next = currentIndex + 1;
    if (next >= timeSeriesList.length) {
      console.log("結束了");
      setTickDuration(null);
    } else {
      setCurrentIndex(next);
      filterData(R.values(timeSeriesData)[next]);
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
