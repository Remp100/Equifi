import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "../Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faChartLine,
  faEye,
  faFolder,
  faUser,
  faSignOutAlt,
  faCalendarAlt,
  faSearch,
  faUserCog,
  faExclamation,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

export default function DashboardWatchlist() {
  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [assetSymbol, setAssetSymbol] = useState("");
  const [searchState, setSearchState] = useState({
    companyName: "",
    hasSearched: false,
    suggestions: [],
  });
  const [searchResult, setSearchResult] = useState(null);
  const searchBarRef = useRef(null);
  const [showInput, setShowInput] = useState(true);
  const [savedAssets, setSavedAssets] = useState([]);
  const [displayType, setDisplayType] = useState(
    localStorage.getItem("displayType") || "returns"
  );
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [interval, setInterval] = useState("Interval");
  const apiKey = process.env.REACT_APP_API_KEY;
  const searchApiUrl = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${apiKey}`;
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [alertFadeOut, setAlertFadeOut] = useState(false);

  // Effect to check login status when component mounts
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

  // Effect to navigate to login page if user is not logged in
  useEffect(() => {
    if (isLoggedIn === false) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

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

  // Function to fetch and update chart data based on selected asset and date range
  const updateChartData = useCallback(
    (symbol) => {
      if (!symbol || !startDate || !endDate || interval === "Interval") {
        return;
      }

      const fetchInterval = interval === "Daily" ? "4hour" : interval;
      const newApiUrl = `https://financialmodelingprep.com/api/v3/historical-chart/${fetchInterval}/${symbol}?apikey=${apiKey}`;

      fetch(newApiUrl)
        .then((response) => response.json())
        .then((data) => {
          const filteredData = data.filter((item) => {
            const date = new Date(item.date);
            return date >= startDate && date <= endDate;
          });
          setData(filteredData);
          if (filteredData.length === 0) {
            setWarning("Asset has no data");
            setIsAlertVisible(true);
            setAlertFadeOut(false);
          } else {
            setWarning("");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          setWarning("An error occurred while fetching data.");
          setIsAlertVisible(true);
          setAlertFadeOut(false);
        });
    },
    [interval, startDate, endDate, apiKey]
  );

  // Effect to search for the company and get asset symbol
  useEffect(() => {
    if (searchState.hasSearched && searchState.companyName) {
      fetch(searchApiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (!data) {
            console.error("Error: Data is null");
            return;
          }

          const foundItems = data.filter((item) => {
            return (
              item.name &&
              item.name.toLowerCase() === searchState.companyName.toLowerCase()
            );
          });

          setAssetSymbol(foundItems.length > 0 ? foundItems[0].symbol : "");
          setSearchState({
            ...searchState,
            hasSearched: false,
          });
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  }, [searchApiUrl, searchState]);

  // Effect to update chart data when asset symbol, dates or interval changes
  useEffect(() => {
    if (assetSymbol && startDate && endDate && interval) {
      updateChartData(assetSymbol);
    }
  }, [assetSymbol, startDate, endDate, interval, updateChartData]);

  // Function to draw the chart
  const drawChart = useCallback(() => {
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const newChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data
          ? data
              .map((item) => new Date(item.date).toLocaleDateString())
              .reverse()
          : [],
        datasets: [
          {
            label: displayType === "returns" ? "Returns" : "Close Value",
            data: data
              ? displayType === "returns"
                ? calculateReturns(data.map((item) => item.close))
                : data.map((item) => item.close)
              : [],
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          x: {
            display: true,
            ticks: {
              font: {
                size: 12,
              },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });
    chartInstanceRef.current = newChartInstance;
  }, [data, displayType]);

  // Effect to initialize the chart with empty data on component mount
  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");
    const initialChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "No data",
            data: [],
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          x: {
            display: true,
            ticks: {
              font: {
                size: 12,
              },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });
    chartInstanceRef.current = initialChartInstance;

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Effect to redraw the chart when data or display type changes
  useEffect(() => {
    if (data) {
      drawChart();
    }
  }, [data, displayType, drawChart]);

  // Function to calculate returns for the asset
  const calculateReturns = (data) => {
    if (data.length < 2) return [];
    const returns = data.slice(1).map((currentClose, index) => {
      const previousClose = data[index];
      return ((currentClose - previousClose) / previousClose) * 100;
    });
    return returns;
  };

  // Function to save the asset to the user's watchlist
  const handleSaveAsset = () => {
    if (
      interval === "Interval" ||
      !data ||
      data.length === 0 ||
      data[data.length - 1]?.close === undefined
    ) {
      setWarning("Asset has no data");
      setIsAlertVisible(true);
      setAlertFadeOut(false);
      return;
    }

    axios
      .post("http://localhost:3002/save-asset", {
        email: email,
        assetSymbol: assetSymbol,
      })
      .then((response) => {
        if (response.status === 200) {
          setSavedAssets((prevSavedAssets) => [
            ...prevSavedAssets,
            assetSymbol,
          ]);
          setIsSuccessAlertVisible(true);
          setAlertFadeOut(false);
        } else if (response.status === 400) {
          setWarning("Asset is already saved.");
          setIsAlertVisible(true);
          setAlertFadeOut(false);
        } else {
          setWarning("Failed to save asset.");
          setIsAlertVisible(true);
          setAlertFadeOut(false);
        }
      })
      .catch((error) => {
        console.error("Error saving asset:", error);
        setWarning("An error occurred while saving the asset.");
        setIsAlertVisible(true);
        setAlertFadeOut(false);
      });
  };

  // Effect to fetch saved assets for the user
  useEffect(() => {
    axios
      .get(`http://localhost:3002/saved-assets/${email}`)
      .then((response) => {
        const assets = response.data.savedAssets;
        setSavedAssets(assets);
        if (assets.length === 0) {
          setWarning("No assets were saved");
          setIsAlertVisible(true);
          setAlertFadeOut(false);
        } else {
          setWarning("");
        }
      })
      .catch((error) => {
        console.error("Error fetching saved assets:", error);
      });
  }, [email]);

  // Function to handle input change for asset search
  const handleInputChange = (e) => {
    const input = e.target.value;
    setSearchState((prevState) => ({
      ...prevState,
      companyName: input,
    }));

    if (input.trim() === "") {
      setSearchState((prevState) => ({
        ...prevState,
        suggestions: [],
      }));
      return;
    }

    fetchSuggestions(input);
  };

  // Function to fetch asset suggestions based on user input
  const fetchSuggestions = (input) => {
    fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${input}&limit=5&apikey=${apiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data) {
          console.error("Error: Data is null");
          setSearchState((prevState) => ({
            ...prevState,
            suggestions: [],
          }));
          return;
        }

        const profilePromises = data.map((item) =>
          fetch(
            `https://financialmodelingprep.com/api/v3/profile/${item.symbol}?apikey=${apiKey}`
          )
            .then((response) => response.json())
            .then((profileData) => ({
              ...item,
              profile: profileData[0],
            }))
        );

        Promise.all(profilePromises)
          .then((profiles) => {
            const filteredSuggestions = profiles
              .filter(
                (profile) =>
                  profile.profile && profile.profile.currency === "USD"
              )
              .map((profile) => ({
                name: profile.name,
                symbol: profile.symbol,
              }));

            setSearchState((prevState) => ({
              ...prevState,
              suggestions: filteredSuggestions,
            }));
          })
          .catch((error) => {
            console.error("Error fetching profiles:", error);
            setSearchState((prevState) => ({
              ...prevState,
              suggestions: [],
            }));
          });
      })
      .catch((error) => {
        console.error("Error fetching suggestions:", error);
        setSearchState((prevState) => ({
          ...prevState,
          suggestions: [],
        }));
      });
  };

  // Function to handle input focus for asset search
  const handleInputFocus = () => {
    if (searchState.companyName.trim() !== "") {
      fetchSuggestions(searchState.companyName);
    }
  };

  // Function to handle asset button click to update chart
  const handleAssetButtonClick = (assetSymbol) => {
    setAssetSymbol(assetSymbol);
  };

  // Function to handle suggestion click from dropdown
  const handleSuggestionClick = (name, symbol) => {
    setSearchResult([{ name, symbol }]);
    setSearchState({
      ...searchState,
      companyName: "",
      suggestions: [],
    });
    setShowInput(false);
    setAssetSymbol(symbol);
  };

  // Function to toggle display type between historical and returns
  const handleToggleChange = () => {
    const newDisplayType =
      displayType === "historical" ? "returns" : "historical";
    setDisplayType(newDisplayType);
    localStorage.setItem("displayType", newDisplayType);
  };

  // Function to handle click outside of search bar to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target)
      ) {
        setSearchState((prevState) => ({
          ...prevState,
          suggestions: [],
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchBarRef]);

  // Function to delete saved asset from watchlist
  const handleDeleteAsset = (assetSymbol) => {
    axios
      .post("http://localhost:3002/delete-saved-asset", {
        email: email,
        assetSymbol: assetSymbol,
      })
      .then((response) => {
        if (response.status === 200) {
          setSavedAssets((prevSavedAssets) =>
            prevSavedAssets.filter((asset) => asset !== assetSymbol)
          );
          setIsSuccessAlertVisible(true);
          setAlertFadeOut(false);
        } else {
          setWarning("Failed to delete asset.");
          setIsAlertVisible(true);
          setAlertFadeOut(false);
        }
      })
      .catch((error) => {
        console.error("Error deleting asset:", error);
        setWarning("An error occurred while deleting the asset.");
        setIsAlertVisible(true);
        setAlertFadeOut(false);
      });
  };

  const menuRef = useRef(null);
  useEffect(() => {
    let handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        console.log(
          "Clicked outside:",
          e.target,
          menuRef.current.contains(e.target)
        );
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
    console.log(savedAssets);
  }, [savedAssets]);

  const handleCloseWithFade = () => {
    setAlertFadeOut(true);
    setTimeout(() => {
      setIsAlertVisible(false);
      setIsSuccessAlertVisible(false);
    }, 500);
  };

  // Automatically hide error alert after 5 seconds
  useEffect(() => {
    if (isAlertVisible) {
      setAlertFadeOut(false); // Ensure fade-out is reset
      const timer = setTimeout(() => {
        setAlertFadeOut(true);
        setTimeout(() => {
          setIsAlertVisible(false);
          setAlertFadeOut(false); // Reset for next use
        }, 500);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isAlertVisible]);

  // Automatically hide success alert after 5 seconds
  useEffect(() => {
    if (isSuccessAlertVisible) {
      setAlertFadeOut(false); // Reset fade-out
      const timer = setTimeout(() => {
        setAlertFadeOut(true);
        setTimeout(() => {
          setIsSuccessAlertVisible(false);
          setAlertFadeOut(false); // Reset for next use
        }, 500);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSuccessAlertVisible]);

  const renderStatusMessage = () => {
    if (isAlertVisible) {
      return (
        <div className={`alert error ${alertFadeOut ? "fade-out" : ""}`}>
          <FontAwesomeIcon icon={faExclamation} className="mr-2" />
          {warning}
          <button className="alert close-btn" onClick={handleCloseWithFade}>
            X
          </button>
        </div>
      );
    }
    return null;
  };

  const renderSuccessAlert = () => {
    if (isSuccessAlertVisible) {
      return (
        <div className={`alert success ${alertFadeOut ? "fade-out" : ""}`}>
          <FontAwesomeIcon icon={faCheck} className="mr-2" />
          Portfolio saved successfully!
          <button className="alert close-btn" onClick={handleCloseWithFade}>
            X
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard">
      <div className="sidebar-watchlist">
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
          <Link to="/dashboard/watchlist" className="menu-item active">
            <FontAwesomeIcon icon={faEye} className="menu-icon" /> Watchlist
          </Link>
          <Link to="/dashboard/portfolios" className="menu-item">
            <FontAwesomeIcon icon={faFolder} className="menu-icon" /> Portfolios
          </Link>
        </nav>
      </div>
      <div className="main-content">
        <div className="alert-invest">{renderStatusMessage()}</div>
        <div className="alert-invest">{renderSuccessAlert()}</div>
        <div className="profile-dropdown-watchlist">
          <div className="nav-menu" ref={menuRef}>
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
        <div className="content-watchlist">
          {/* Input Section */}
          <div className="card-watchlist input-section">
            <h2 className="text-center">Search Assets</h2>
            <div className="input-row">
              {showInput && (
                <div className="search-bar-watchlist" ref={searchBarRef}>
                  <input
                    type="text"
                    value={searchState.companyName}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder="Search for an asset"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="search-icon-watchlist"
                  />
                  {searchState.suggestions.length > 0 && (
                    <div className="suggestion-dropdown-watchlist">
                      <ul>
                        {searchState.suggestions.map((item) => (
                          <li
                            key={item.symbol}
                            onClick={() =>
                              handleSuggestionClick(item.name, item.symbol)
                            }
                          >
                            {item.name} ({item.symbol})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {searchResult && searchResult.length > 0 && (
                <div className="search-results-watchlist">
                  <ul className="search-results-list">
                    {searchResult.map((item) => (
                      <li
                        key={item.symbol}
                        className="search-result-item-watchlist"
                      >
                        <span className="search-result-text">
                          {item.name} ({item.symbol})
                        </span>
                        <button
                          className="delete-button"
                          onClick={() => {
                            setShowInput(true);
                            setSearchResult(null);
                            setWarning("");
                          }}
                        >
                          X
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="start-date-picker-wrapper-watchlist">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  placeholderText="Select start date"
                  maxDate={yesterday}
                  onKeyDown={(e) => e.preventDefault()}
                />
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="calendar-icon-watchlist-start-date"
                />
              </div>
            </div>
            <div className="input-row">
              <div className="interval-wrapper-watchlist">
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="interval-select-watchlist"
                >
                  <option hidden>Interval</option>
                  <option value="1m">1 Minute</option>
                  <option value="5m">5 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1hour">1 Hour</option>
                  <option value="4hour">4 Hour</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>
              <div className="end-date-picker-wrapper-watchlist">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  placeholderText="Select end date"
                  maxDate={new Date()}
                  className="date-picker-input"
                  onKeyDown={(e) => e.preventDefault()}
                />
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="calendar-icon-watchlist-end-date"
                />
              </div>
            </div>
            <div className="save-asset-wrapper">
              <button className="btn save-asset" onClick={handleSaveAsset}>
                Save Asset
              </button>
            </div>
            <div className="card saved-assets">
              <h2>Saved Assets</h2>
              {savedAssets.length > 0 ? (
                <ul>
                  {savedAssets.map((assetSymbol) => (
                    <li key={assetSymbol}>
                      <button
                        className="btn view-asset"
                        onClick={() => handleAssetButtonClick(assetSymbol)}
                      >
                        {assetSymbol}
                      </button>
                      <button
                        className="btn delete-asset"
                        onClick={() => handleDeleteAsset(assetSymbol)}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No assets saved yet. Add some assets above!</p>
              )}
            </div>
          </div>

          {/* Chart Section */}
          <div className="card-watchlist chart-container">
            <h2 className="text-center">Performance Chart</h2>
            <div className="toggle-section">
              <label className="toggle-label">
                <Toggle
                  checked={displayType === "returns"}
                  onChange={handleToggleChange}
                  icons={false}
                  className="custom-toggle"
                />
                <span
                  className={`toggle-text-left ${
                    displayType === "historical" ? "active" : ""
                  }`}
                >
                  Historical
                </span>
                <span
                  className={`toggle-text-right ${
                    displayType === "returns" ? "active" : ""
                  }`}
                >
                  Returns
                </span>
              </label>
            </div>
            <canvas className="canvas-watchlist" ref={chartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
