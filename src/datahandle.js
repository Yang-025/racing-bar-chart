import * as d3 from "d3";
import * as R from "ramda";

// 根據資料的勝場數排名，增加rank欄位紀錄排名
function rankData(data) {
  const sortUpdatedData = R.sortWith([R.descend(R.prop("number"))])(data);

  const addRankDataset = sortUpdatedData.map((d, i) => {
    return { ...d, rank: i + 1 };
  });
  return addRankDataset;
}

// 西區聯盟
const westernConference = [
  "Oklahoma City",
  "Portland",
  "Utah",
  "Denver",
  "Minnesota",
  "Golden State",
  "Los Angeles Clippers",
  "Sacramento",
  "Phoenix",
  "Los Angeles Lakers",
  "San Antonio",
  "Dallas",
  "Memphis",
  "Houston",
  "New Orleans"
];

function handleMonthStats(data) {
  // 計算每個隊每個月贏的次數
  const teamWinsByMonth = R.pipe(
    R.sort(R.ascend(R.compose(s => new Date(s), R.prop("date")))),
    R.groupBy(R.prop("team")),
    R.map(R.groupBy(x => R.prop("date")(x).substr(0, 7))),
    R.map(byDate => {
      return Object.keys(byDate).map(date => {
        return {
          date,
          team: byDate[date][0].team,
          conference: "western",
          winCount: byDate[date].length
        };
      });
    })
  )(data);

  // 轉回以月份為主的型態
  const monthStats = R.pipe(
    R.values,
    R.flatten,
    R.sort(R.ascend(R.compose(s => new Date(s), R.prop("date")))),
    R.groupBy(R.prop("date"))
  )(teamWinsByMonth);
  return monthStats;
}

// 西區有十五隊。每個月都應該有十五隊
function fillVacancyStats(data, teamList) {
  // 每個月分都應該要有15隊的資料，如果有缺的話就補零
  const stats = Object.keys(data).map(date => {
    const diff = R.difference(
      teamList,
      data[date].map(x => x.team)
    ).map(team => {
      return {
        date,
        team,
        conference: "western",
        winCount: 0
      };
    });
    return [...data[date], ...diff];
  });

  return stats;
}

// 處理每個隊伍的累計勝場數
function handleMonthAccuStats(data, teamList) {
  const scale = d3.scaleOrdinal(d3.schemeTableau10).domain(teamList);

  const allFinalData = R.pipe(
    R.flatten,
    R.sort(R.ascend(R.compose(s => new Date(s), R.prop("date")))),
    R.groupBy(R.prop("team")),
    R.map(stats => {
      return stats.reduce((accu, d, i) => {
        if (i === 0) {
          return [
            ...accu,
            {
              name: d.team,
              conference: d.conference,
              color: scale(d.team),
              date: d.date,
              number: d.winCount,
              last_number: 0
            }
          ];
        } else {
          const lastMonthAccuWins = accu[i - 1].number;
          return [
            ...accu,
            {
              name: d.team,
              conference: d.conference,
              color: scale(d.team),
              date: d.date,
              number: d.winCount + lastMonthAccuWins,
              last_number: lastMonthAccuWins
            }
          ];
        }
      }, []);
    })
  )(data);

  const fGroupByDateData = R.pipe(
    R.values,
    R.flatten,
    R.sort(R.ascend(R.compose(s => new Date(s), R.prop("date")))),
    R.groupBy(R.prop("date"))
  )(allFinalData);

  return fGroupByDateData;
}

async function handleCsv() {
  // Step1. 讀取資料
  const data = await d3.csv("/data.csv");

  // Step2. 整理第一手資料，紀錄當天贏的隊伍和所處聯盟
  const tmpData = data.map(d => {
    const winTeam =
      +d.VisitorPTS > +d.HomePTS ? d["Visitor/Neutral"] : d["Home/Neutral"];
    return {
      date: d3.timeFormat("%Y-%m-%d")(d3.timeParse("%a %b %e %Y")(d.Date)),
      team: winTeam,
      conference: westernConference.find(x => winTeam.includes(x))
        ? "western"
        : "eastern"
    };
  });

  // 只觀察西區資料
  const westernData = tmpData.filter(x => x.conference === "western");
  // Step3. 整理出每月每個隊伍的勝場數
  const tmpMonthStats = handleMonthStats(westernData);

  // 西區所有隊伍
  const allTeams = R.pipe(R.map(R.prop("team")), R.uniq)(westernData);

  // Step4. 補齊缺失資料
  const monthStats = fillVacancyStats(tmpMonthStats, allTeams);
  
  // Step5. 處理每個隊伍的累計勝場數
  const monthAccuStats = handleMonthAccuStats(monthStats, allTeams);

  // Step6. 加上排名
  const res = R.map(x => rankData(x))(monthAccuStats);
  console.log("res", res);
  return res;
}

export default handleCsv;
