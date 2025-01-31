import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "../Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Chart from "chart.js/auto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChartLine,
  faEye,
  faFolder,
  faUser,
  faSignOutAlt,
  faUserCog,
  faCheck,
  faExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardPortfolios() {
  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [email, setEmail] = useState("");
  const [portfolioData, setPortfolioData] = useState([]);
  const [warning, setWarning] = useState(
    <span>
      No portfolios saved. To save your own Portfolio, visit{" "}
      <Link to="/dashboard/invest" className="styled-link">
        Invest
      </Link>
      .
    </span>
  );
  const [riskFreeRate, setRiskFreeRate] = useState(null);
  const [differences, setDifferences] = useState([]);
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [downloadLoading, setDownloadLoading] = useState([]);
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [alertFadeOut, setAlertFadeOut] = useState(false);
  const apiKey = process.env.REACT_APP_API_KEY;

  // Effect to check login status on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get("http://localhost:3002", {
          withCredentials: true,
        });
        const { valid, email, firstName, lastName } = response.data;
        setIsLoggedIn(valid);
        setEmail(email || "");
        setFirstName(firstName || "");
        setLastName(lastName || "");
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  // Effect to redirect to login page if not logged in
  useEffect(() => {
    if (isLoggedIn === false) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Effect to fetch portfolio data
  useEffect(() => {
    if (email.length > 0) {
      const fetchPortfolioData = async () => {
        try {
          const response = await axios.post(
            "http://localhost:3002/get-portfolio-data",
            {
              email: email,
            }
          );
          if (response.status === 200) {
            const portfolios = response.data.portfolioData;
            const updatedPortfolios = await Promise.all(
              portfolios.map(async (portfolio) => {
                const symbols = [
                  portfolio.asset1Name,
                  portfolio.asset2Name,
                  portfolio.asset3Name,
                  portfolio.asset4Name,
                ].filter(Boolean);
                const interval = portfolio.interval;
                const startDate = portfolio.startDate;
                const endDate = portfolio.endDate;

                const dataPromises = symbols.map((symbol) => {
                  const key = `${symbol}-${interval}-${startDate}-${endDate}`;
                  let historicalData = localStorage.getItem(key);
                  if (historicalData) {
                    return Promise.resolve(JSON.parse(historicalData));
                  } else {
                    return fetchHistoricalData(
                      symbol,
                      interval,
                      startDate,
                      endDate
                    ).then((data) => {
                      localStorage.setItem(key, JSON.stringify(data));
                      return data;
                    });
                  }
                });

                const allData = await Promise.all(dataPromises);
                const dates = allData[0].map((entry) => entry.date);
                const closeValues = allData[0].map((entry) => entry.close);

                return {
                  ...portfolio,
                  dates,
                  closeValues,
                  symbols,
                };
              })
            );
            setPortfolioData(updatedPortfolios);
            setDifferences(new Array(updatedPortfolios.length).fill({}));
          } else {
            setPortfolioData([]);
          }
        } catch (error) {
          console.error("Error fetching portfolio data:", error);
        }
      };
      fetchPortfolioData();
    } else {
      setWarning(
        <span>
          No portfolios saved. To save your own Portfolio, visit{" "}
          <Link to="/dashboard/invest" className="styled-link">
            Invest
          </Link>
          .
        </span>
      );
    }
    // eslint-disable-next-line
  }, [email]);

  // Effect to fetch risk-free rate
  useEffect(() => {
    const fetchRiskFreeRate = async () => {
      const cachedRate = sessionStorage.getItem("riskFreeRate");
      if (cachedRate) {
        setRiskFreeRate(parseFloat(cachedRate));
      } else {
        const apiKey = "M4H1P0NX0B015FR8";
        const url = `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=monthly&maturity=3month&apikey=${apiKey}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data["data"] && data["data"].length > 0) {
            const firstRate = parseFloat(data["data"][0]["value"]);
            sessionStorage.setItem("riskFreeRate", firstRate);
            setRiskFreeRate(firstRate);
          } else {
            console.error("Unexpected API response format:", data);
          }
        } catch (error) {
          console.error("Error fetching risk-free rate:", error);
        }
      }
    };

    fetchRiskFreeRate();
  }, []);

  // Utility functions for calculating financial metrics
  const calculateReturns = (data) => {
    if (!data || data.length < 2) return [];
    const returns = data.slice(1).map((currentClose, index) => {
      const previousClose = data[index].close;
      if (previousClose === 0) return undefined;
      const change =
        ((currentClose.close - previousClose) / previousClose) * 100;
      return change;
    });
    return returns.filter((r) => r !== undefined);
  };

  const calculateCovariance = (x, y) => {
    const n = x.length;
    const meanX = x.reduce((acc, curr) => acc + curr, 0) / n;
    const meanY = y.reduce((acc, curr) => acc + curr, 0) / n;
    return (
      x
        .map((val, idx) => (val - meanX) * (y[idx] - meanY))
        .reduce((acc, curr) => acc + curr, 0) /
      (n - 1)
    );
  };

  const calculateStandardDeviation = (data) => {
    const n = data.length;
    const mean = data.reduce((acc, curr) => acc + curr, 0) / n;
    return Math.sqrt(
      data
        .map((x) => Math.pow(x - mean, 2))
        .reduce((acc, curr) => acc + curr, 0) /
        (n - 1)
    );
  };

  const calculateMeanReturn = (returns) => {
    const sum = returns.reduce((acc, curr) => acc + curr, 0);
    return sum / returns.length;
  };

  const calculateCorrelationMatrix = useCallback((allData) => {
    if (allData.length === 0) return [];
    let matrix = new Array(allData.length)
      .fill(0)
      .map(() => new Array(allData.length).fill(0));
    for (let i = 0; i < allData.length; i++) {
      for (let j = i; j < allData.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const covariance = calculateCovariance(allData[i], allData[j]);
          const stdI = calculateStandardDeviation(allData[i]);
          const stdJ = calculateStandardDeviation(allData[j]);
          matrix[i][j] = matrix[j][i] = covariance / (stdI * stdJ);
        }
      }
    }
    return matrix;
  }, []);

  const calculatePortfolioMetrics = useCallback(
    (weights, assetsReturn, assetsVol, assetsCorrelationMatrix) => {
      const portfolioReturn = weights.reduce(
        (acc, weight, index) => acc + weight * assetsReturn[index],
        0
      );

      let portfolioVolatility = 0;
      for (let i = 0; i < weights.length; i++) {
        for (let j = 0; j < weights.length; j++) {
          portfolioVolatility +=
            weights[i] *
            weights[j] *
            assetsVol[i] *
            assetsVol[j] *
            assetsCorrelationMatrix[i][j];
        }
      }
      portfolioVolatility = Math.sqrt(portfolioVolatility);

      const sharpeRatio =
        (portfolioReturn - riskFreeRate) / portfolioVolatility;

      return {
        return: portfolioReturn,
        volatility: portfolioVolatility,
        sharpeRatio,
      };
    },
    [riskFreeRate]
  );

  // Function to fetch historical data from the API
  const fetchHistoricalData = async (symbol, interval, startDate, endDate) => {
    let apiInterval = interval;
    if (interval === "Daily") {
      apiInterval = "4hour";
    }

    const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
    const formattedEndDate = new Date(endDate).toISOString().split("T")[0];
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/${apiInterval}/${symbol}?from=${formattedStartDate}&to=${formattedEndDate}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      let data = await response.json();

      if (interval === "Daily") {
        const groupedByDate = data.reduce((acc, cur) => {
          const date = new Date(cur.date).toISOString().split("T")[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(cur);
          return acc;
        }, {});

        data = Object.keys(groupedByDate).map((date) => ({
          date,
          close:
            groupedByDate[date].reduce((sum, value) => sum + value.close, 0) /
            groupedByDate[date].length,
        }));
      }

      if (
        new Date(formattedEndDate) - new Date(formattedStartDate) >
        7 * 24 * 60 * 60 * 1000
      ) {
        const groupedByWeek = data.reduce((acc, cur) => {
          const week = new Date(cur.date).toISOString().slice(0, 10);
          if (!acc[week]) acc[week] = [];
          acc[week].push(cur);
          return acc;
        }, {});

        data = Object.keys(groupedByWeek).map((week) => ({
          date: week,
          close:
            groupedByWeek[week].reduce((sum, value) => sum + value.close, 0) /
            groupedByWeek[week].length,
        }));
      }

      return data;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return [];
    }
  };

  // Function to calculate best outcome based on percentile
  const calculateBestOutcome = useCallback((percentile, returns) => {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.ceil(percentile * sortedReturns.length) - 1;
    return sortedReturns[index];
  }, []);

  // Function to calculate date difference in days
  const calculateDateDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const difference = Math.abs(end - start);
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  };

  // Function to calculate new start date based on difference
  const calculateNewStartDate = (endDate, difference) => {
    const end = new Date(endDate);
    const newStart = new Date(end.setDate(end.getDate() - difference));
    return newStart.toISOString().split("T")[0];
  };

  // Function to handle check button click
  const handleCheckButton = async (index) => {
    try {
      const portfolio = portfolioData[index];
      const interval = portfolio.interval;
      const originalStartDate = portfolio.startDate;
      const originalEndDate = portfolio.endDate;

      if (!originalStartDate || !originalEndDate || !interval) {
        throw new Error(
          "Start date, end date, or interval is missing in the portfolio data."
        );
      }

      const difference = calculateDateDifference(
        originalStartDate,
        originalEndDate
      );

      const today = new Date();
      const newEndDate = today.toISOString().split("T")[0];
      const newStartDate = calculateNewStartDate(newEndDate, difference);

      const symbols = [
        portfolio.asset1Name,
        portfolio.asset2Name,
        portfolio.asset3Name,
        portfolio.asset4Name,
      ].filter(Boolean);

      const weights = [
        parseFloat(portfolio.asset1Percent),
        parseFloat(portfolio.asset2Percent),
        parseFloat(portfolio.asset3Percent),
        parseFloat(portfolio.asset4Percent),
      ]
        .filter(Boolean)
        .map((weight) => weight / 100);

      const dataPromises = symbols.map((symbol) =>
        fetchHistoricalData(symbol, interval, newStartDate, newEndDate)
      );

      const allData = await Promise.all(dataPromises);

      const returns = allData.map((data) => calculateReturns(data));

      const meanReturns = returns.map((r) => {
        const meanReturn = calculateMeanReturn(r);
        return meanReturn;
      });

      const volatilities = returns.map((r) => calculateStandardDeviation(r));

      const correlationMatrix = calculateCorrelationMatrix(returns);

      const metrics = calculatePortfolioMetrics(
        weights,
        meanReturns,
        volatilities,
        correlationMatrix
      );

      const expectedReturnDiff = (
        metrics.return - parseFloat(portfolio.expectedReturn)
      ).toFixed(2);
      const bestOutcomeDiff = (
        calculateBestOutcome(0.99, meanReturns) -
        parseFloat(portfolio.bestOutcome)
      ).toFixed(2);

      const updatedDifferences = differences.map((diff, i) =>
        i === index ? { expectedReturnDiff, bestOutcomeDiff } : diff
      );

      setDifferences(updatedDifferences);
    } catch (error) {
      console.error("Error in handleCheckButton: ", error);
    }
  };

  // Function to handle update button click
  const handleUpdateButton = async (index) => {
    try {
      showAlert("success", "Portfolio updated successfully!");
      const portfolio = portfolioData[index];
      const interval = portfolio.interval;
      const originalStartDate = portfolio.startDate;
      const originalEndDate = portfolio.endDate;

      if (!originalStartDate || !originalEndDate || !interval) {
        throw new Error(
          "Start date, end date, or interval is missing in the portfolio data."
        );
      }

      const difference = calculateDateDifference(
        originalStartDate,
        originalEndDate
      );

      const today = new Date();
      const newEndDate = today.toISOString().split("T")[0];
      const newStartDate = calculateNewStartDate(newEndDate, difference);

      const symbols = [
        portfolio.asset1Name,
        portfolio.asset2Name,
        portfolio.asset3Name,
        portfolio.asset4Name,
      ].filter(Boolean);

      const weights = [
        parseFloat(portfolio.asset1Percent),
        parseFloat(portfolio.asset2Percent),
        parseFloat(portfolio.asset3Percent),
        parseFloat(portfolio.asset4Percent),
      ]
        .filter(Boolean)
        .map((weight) => weight / 100);

      const dataPromises = symbols.map((symbol) =>
        fetchHistoricalData(symbol, interval, newStartDate, newEndDate)
      );

      const allData = await Promise.all(dataPromises);

      const returns = allData.map((data) => calculateReturns(data));

      const meanReturns = returns.map((r) => {
        const meanReturn = calculateMeanReturn(r);
        return meanReturn;
      });

      const volatilities = returns.map((r) => calculateStandardDeviation(r));

      const correlationMatrix = calculateCorrelationMatrix(returns);

      const metrics = calculatePortfolioMetrics(
        weights,
        meanReturns,
        volatilities,
        correlationMatrix
      );

      const updatedPortfolio = {
        ...portfolio,
        expectedReturn: metrics.return.toFixed(2),
        bestOutcome: calculateBestOutcome(0.99, meanReturns).toFixed(2),
        dateUpdated: new Date(),
      };

      const updatedPortfolios = portfolioData.map((p, i) =>
        i === index ? updatedPortfolio : p
      );
      setPortfolioData(updatedPortfolios);
      const updatedDifferences = differences.map((diff, i) =>
        i === index ? {} : diff
      );

      setDifferences(updatedDifferences);
    } catch (error) {
      console.error("Error in handleUpdateButton: ", error);
    }
  };

  // Function to handle delete button click
  const handleDeleteButton = async (index) => {
    try {
      await axios.post("http://localhost:3002/delete-portfolio", {
        email: email,
        portfolioIndex: index,
      });

      showAlert("warning", "Portfolio deleted successfully!");
      const updatedPortfolios = portfolioData.filter((_, i) => i !== index);
      const updatedDifferences = differences.filter((_, i) => i !== index);

      setPortfolioData(updatedPortfolios);
      setDifferences(updatedDifferences);
    } catch (error) {
      console.error("Error in handleDeleteButton: ", error);
    }
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3002/logout", {
        withCredentials: true,
      });
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to generate PDF for portfolio data
  const generatePdf = async (index) => {
    setDownloadLoading((prevState) => {
      const newState = [...prevState];
      newState[index] = true;
      return newState;
    });
    if (
      portfolioData.length === 0 ||
      index < 0 ||
      index >= portfolioData.length
    ) {
      console.error("Invalid index or portfolio data is not available");
      return;
    }

    const pdf = new jsPDF();
    const portfolio = portfolioData[index];

    const addTitle = (title, startY) => {
      pdf.setFontSize(16);
      pdf.text(title, 15, startY);
      return startY + 10;
    };

    const addTable = (title, data, startY) => {
      startY = addTitle(title, startY);
      pdf.autoTable({
        head: [["Key", "Value"]],
        body: data,
        startY: startY,
      });

      return pdf.previousAutoTable.finalY;
    };

    const addChart = async (label, data, color, startY) => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");

      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [
            {
              label: label,
              data: data.values,
              borderColor: color,
              fill: false,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const chartDataUrl = canvas.toDataURL("image/png");
      pdf.addImage(chartDataUrl, "PNG", 15, startY, 180, 100);

      return startY + 110;
    };

    const addHistoricalAndReturnsCharts = async (
      dates,
      closeValues,
      labelPrefix,
      startY
    ) => {
      const labels = dates;
      const values = closeValues;
      const returns = calculateReturns(closeValues.map((close) => ({ close })));

      let nextY = startY;
      nextY = await addChart(
        `${labelPrefix} Historical Close Values`,
        { labels, values },
        "blue",
        nextY
      );
      if (nextY > 200) {
        pdf.addPage();
        nextY = 20;
      }
      nextY += 10;
      nextY = await addChart(
        `${labelPrefix} Returns`,
        { labels, values: returns },
        "green",
        nextY
      );

      return nextY;
    };

    const addCurrentDataCharts = async (
      symbol,
      interval,
      datesLength,
      startY
    ) => {
      const currentEndDate = new Date().toISOString().split("T")[0];
      const currentStartDate = calculateNewStartDate(
        currentEndDate,
        datesLength
      );
      const currentData = await fetchHistoricalData(
        symbol,
        interval,
        currentStartDate,
        currentEndDate
      );

      const currentCloseValues = currentData.map((entry) => entry.close);
      const currentDates = currentData.map((entry) => entry.date);

      let nextY = startY;
      nextY = await addHistoricalAndReturnsCharts(
        currentDates,
        currentCloseValues,
        `Current ${symbol}`,
        nextY
      );

      return nextY;
    };

    const addHistoricalDataTable = (symbol, dates, closeValues, startY) => {
      const tableData = dates.map((date, index) => [date, closeValues[index]]);
      startY = addTitle(`Historical Data for ${symbol}`, startY);

      pdf.autoTable({
        head: [["Date", "Close Value"]],
        body: tableData,
        startY: startY,
      });

      return pdf.previousAutoTable.finalY;
    };

    const addReturnsDataTable = (symbol, dates, returns, startY) => {
      const tableData = dates
        .map((date, index) =>
          returns[index] !== undefined
            ? [date, `${returns[index].toFixed(2)}%`]
            : []
        )
        .filter((row) => row.length > 0);

      startY = addTitle(`Returns Data for ${symbol}`, startY);

      pdf.autoTable({
        head: [["Date", "Return (%)"]],
        body: tableData,
        startY: startY,
      });

      return pdf.previousAutoTable.finalY;
    };

    let startY = 20;
    startY = addTable(
      "Portfolio Data",
      [
        ["Asset 1 Name", portfolio.asset1Name],
        ["Asset 1 %", `${portfolio.asset1Percent}`],
        ["Asset 2 Name", portfolio.asset2Name || "-"],
        [
          "Asset 2 %",
          portfolio.asset2Percent ? `${portfolio.asset2Percent}` : "-",
        ],
        ["Asset 3 Name", portfolio.asset3Name || "-"],
        [
          "Asset 3 %",
          portfolio.asset3Percent ? `${portfolio.asset3Percent}` : "-",
        ],
        ["Asset 4 Name", portfolio.asset4Name || "-"],
        [
          "Asset 4 %",
          portfolio.asset4Percent ? `${portfolio.asset4Percent}` : "-",
        ],
        ["Expected Return", portfolio.expectedReturn],
        ["Risk", portfolio.risk],
        ["Best Outcome", portfolio.bestOutcome],
        ["Date Created", new Date(portfolio.dateCreated).toLocaleString()],
        ["Date Updated", new Date(portfolio.dateUpdated).toLocaleString()],
      ],
      startY
    );
    startY += 20;

    for (let i = 0; i < portfolio.symbols.length; i++) {
      const symbol = portfolio.symbols[i];
      const closeValues = portfolio.closeValues;
      const dates = portfolio.dates;

      const returns = calculateReturns(closeValues.map((close) => ({ close })));

      startY = addHistoricalDataTable(symbol, dates, closeValues, startY);
      if (startY > 200) {
        pdf.addPage();
        startY = 20;
      }
      startY += 10;
      startY = addReturnsDataTable(symbol, dates, returns, startY);
      if (startY > 200) {
        pdf.addPage();
        startY = 20;
      }

      startY = await addHistoricalAndReturnsCharts(
        dates,
        closeValues,
        `Past ${symbol}`,
        startY
      );

      if (startY > 200) {
        pdf.addPage();
        startY = 20;
      }

      startY = await addCurrentDataCharts(
        symbol,
        portfolio.interval,
        portfolio.dates.length,
        startY
      );
    }

    pdf.save(`Portfolio ${index + 1}.pdf`);
    setDownloadLoading((prevState) => {
      const newState = [...prevState];
      newState[index] = false;
      showAlert("success", "Portfolio downloaded successfully!"); // Reset the loading state for this row to false
      return newState;
    });
  };

  const menuRef = useRef(null);
  useEffect(() => {
    let handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [menuRef]);

  const initials = `${firstName.charAt(0).toUpperCase()}${lastName
    .charAt(0)
    .toUpperCase()}`;

  useEffect(() => {
    if (alert.type) {
      const timer = setTimeout(() => {
        setAlertFadeOut(true); // Start fade-out animation after 5 seconds
        setTimeout(() => setAlert({ type: "", message: "" }), 500); // Hide the alert after animation
      }, 5000); // Show the alert for 5 seconds
      return () => clearTimeout(timer); // Cleanup timer on unmount or state change
    }
  }, [alert]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setAlertFadeOut(false); // Reset fade-out on new alert
  };

  const renderAlert = () => {
    if (!alert.type) return null;

    const alertClass = `alert ${alert.type} ${alertFadeOut ? "fade-out" : ""}`;
    const icon = alert.type === "success" ? faCheck : faExclamation;

    return (
      <div className={alertClass}>
        <FontAwesomeIcon icon={icon} className="mr-2" />
        {alert.message}
        <button
          className="alert close-btn"
          onClick={() => {
            setAlertFadeOut(true); // Trigger fade-out on close
            setTimeout(() => setAlert({ type: "", message: "" }), 500); // Hide alert after animation
          }}
        >
          X
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="app-title-container">
          <div className="app-title">
            <h3>EquiFi</h3>
          </div>
        </div>
        <nav className="menu">
          <Link to="/dashboard" className="menu-item">
            <FontAwesomeIcon icon={faHome} className="menu-icon" /> Dashboard
          </Link>
          <Link to="/dashboard/invest" className="menu-item">
            <FontAwesomeIcon icon={faChartLine} className="menu-icon" /> Invest
          </Link>
          <Link to="/dashboard/watchlist" className="menu-item">
            <FontAwesomeIcon icon={faEye} className="menu-icon" /> Watchlist
          </Link>
          <Link to="/dashboard/portfolios" className="menu-item active">
            <FontAwesomeIcon icon={faFolder} className="menu-icon" /> Portfolios
          </Link>
        </nav>
      </div>
      <div className="main-content">
        <div className="profile-dropdown-portfolios">
          <div className="nav-menu">
            <div className="menu-trigger">
              <button className="avatar-button" onClick={() => setOpen(!open)}>
                <div className="avatar-wrapper">
                  {" "}
                  {/* New wrapper div */}
                  <div className="avatar-placeholder">{initials}</div>
                </div>
              </button>
            </div>
            <div className={`dropdown-menu ${open ? "active" : "inactive"}`}>
              <div className="account-info">
                <div className="account-initial">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="account-details">
                  <div className="full-name">
                    {firstName} {lastName}
                  </div>
                </div>
              </div>
              <div className="dropdown-links">
                <Link to="/dashboard/profile" className="dropdown-item">
                  <FontAwesomeIcon icon={faUser} className="menu-icon" />
                  Profile
                </Link>
                <Link to="/dashboard/profile" className="dropdown-item">
                  <FontAwesomeIcon icon={faUserCog} className="menu-icon" />
                  Settings
                </Link>
                <div className="dropdown-item" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="menu-icon" />
                  Log out
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="alert-invest">{renderAlert()}</div>
        <div className="portfolios-container">
          {portfolioData.length > 0 ? (
            <div className="portfolio-data">
              <div className="portfolio-table">
                <table className="table-container">
                  <thead>
                    <tr>
                      <th className="rounded-left">#</th>
                      <th>Asset Name & %</th>
                      <th>Expected Return</th>
                      <th>Risk</th>
                      <th>Best Outcome</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th className="rounded-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.map((portfolio, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="assets-group">
                            <div className="asset-item">
                              <span className="asset-name">
                                {portfolio.asset1Name}
                              </span>
                              <span className="asset-percent">
                                {portfolio.asset1Percent}
                              </span>
                            </div>
                            <div className="asset-item">
                              <span className="asset-name">
                                {portfolio.asset2Name || "-"}
                              </span>
                              <span className="asset-percent">
                                {portfolio.asset2Percent || "-"}
                              </span>
                            </div>
                            <div className="asset-item">
                              <span className="asset-name">
                                {portfolio.asset3Name || "-"}
                              </span>
                              <span className="asset-percent">
                                {portfolio.asset3Percent || "-"}
                              </span>
                            </div>
                            <div className="asset-item">
                              <span className="asset-name">
                                {portfolio.asset4Name || "-"}
                              </span>
                              <span className="asset-percent">
                                {portfolio.asset4Percent || "-"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {portfolio.expectedReturn}
                          {differences[index] &&
                            differences[index].expectedReturnDiff !== "0.00" &&
                            differences[index].expectedReturnDiff !==
                              undefined &&
                            ` (${
                              differences[index].expectedReturnDiff > 0
                                ? "+"
                                : ""
                            }${differences[index].expectedReturnDiff})`}
                        </td>
                        <td>{portfolio.risk}</td>
                        <td>
                          {portfolio.bestOutcome}
                          {differences[index] &&
                            differences[index].bestOutcomeDiff !== "0.00" &&
                            differences[index].bestOutcomeDiff !== undefined &&
                            ` (${
                              differences[index].bestOutcomeDiff > 0 ? "+" : ""
                            }${differences[index].bestOutcomeDiff})`}
                        </td>
                        <td>
                          {new Date(portfolio.dateCreated).toLocaleString()}
                        </td>
                        <td>
                          {new Date(portfolio.dateUpdated).toLocaleString()}
                        </td>
                        <td className="actions">
                          <button
                            className="btn-action download"
                            onClick={() => generatePdf(index)}
                            disabled={downloadLoading[index]}
                            style={{
                              pointerEvents: downloadLoading[index]
                                ? "none"
                                : "auto",
                            }}
                          >
                            {downloadLoading[index] ? (
                              <div
                                id="loading-spinner"
                                className="spinner-container"
                              >
                                <div className="spinner"></div>
                              </div>
                            ) : (
                              <>
                                <i className="icon">⬇️</i> Download
                              </>
                            )}
                          </button>
                          <button
                            className="btn-action check"
                            onClick={() => handleCheckButton(index)}
                          >
                            <i className="icon">✅</i> Check
                          </button>
                          <button
                            className="btn-action update"
                            onClick={() => handleUpdateButton(index)}
                          >
                            <i className="icon">✏️</i> Edit
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteButton(index)}
                          >
                            <i className="icon">🗑️</i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="warning-container">
              <p className="warning-text">{warning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
