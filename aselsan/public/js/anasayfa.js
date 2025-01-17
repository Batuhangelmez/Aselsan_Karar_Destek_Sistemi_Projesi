document.addEventListener("DOMContentLoaded", function () {
  const regionSelect = document.getElementById("region-select");
  const platformSelect = document.getElementById("platform-select");
  const productSelect = document.getElementById("product-select");
  const trendChartCanvas = document.getElementById("trend-chart");
  const riskChartCanvas = document.getElementById("risk-chart");
  const comparisonChartCanvas = document.getElementById("comparison-chart");
  let trendChart, riskChart, comparisonChart;

  fetch("/api/anasayfa/regions")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        data.forEach((region) => {
          const option = document.createElement("option");
          option.value = region.name;
          option.textContent = region.name;
          regionSelect.appendChild(option);
        });
      } else {
        console.error("Regions data is not an array:", data);
      }
    })
    .catch((error) => console.error("Regions Fetch Error:", error));

  fetch("/api/anasayfa/platforms")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        data.forEach((platform) => {
          const option = document.createElement("option");
          option.value = platform.id;
          option.textContent = platform.name;
          platformSelect.appendChild(option);
        });
      } else {
        console.error("Platforms data is not an array:", data);
      }
    })
    .catch((error) => console.error("Platforms Fetch Error:", error));

  platformSelect.addEventListener("change", function () {
    const platformId = platformSelect.value;
    productSelect.innerHTML = `<option value="" selected disabled>Ürün Seçiniz</option>`;
    if (platformId) {
      fetch(`/api/anasayfa/products?platform=${platformId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            data.forEach((product) => {
              const option = document.createElement("option");
              option.value = product.id;
              option.textContent = product.name;
              productSelect.appendChild(option);
            });
          } else {
            console.error("Products data is not an array:", data);
          }
        })
        .catch((error) => console.error("Products Fetch Error:", error));
    }
  });

  document
    .getElementById("apply-filters")
    .addEventListener("click", function () {
      const regionId = regionSelect.value;
      const platformId = platformSelect.value;
      const productId = productSelect.value;

      if (regionId && platformId && productId) {
        fetch(
          `/api/anasayfa/trend?region=${regionId}&platform=${platformId}&product=${productId}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.countries && data.averageScore !== undefined) {
              initializeTrendChart(data.countries, data.averageScore);
              fetchRiskData(regionId, data.countries);
            } else {
              console.error("Invalid trend chart data:", data);
            }
          })
          .catch((error) => console.error("Trend Chart Fetch Error:", error));

        fetchComparisonData(regionId, platformId, productId);
      }
    });

  function initializeTrendChart(countries, averageScore) {
    const scores = countries.map((item) => item.score);
    const labels = countries.map((item) => item.country);

    if (trendChart) trendChart.destroy();

    const gradient = trendChartCanvas
      .getContext("2d")
      .createLinearGradient(0, 0, trendChartCanvas.width, 0);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.8)");
    gradient.addColorStop(1, "rgba(54, 100, 200, 0.8)");

    trendChart = new Chart(trendChartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Yönelim Skoru/100",
            data: scores,
            backgroundColor: gradient,
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
            borderRadius: 10,
          },
          {
            type: "line",
            label: "Ortalama Skor",
            data: Array(labels.length).fill(averageScore),
            borderColor: "red",
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "black",
              font: {
                size: 12,
                weight: "normal",
              },
            },
          },
        },
      },
    });
  }

  function initializeRiskChart(countries, averageRisk) {
    const risks = countries.map((item) => item.risk);
    const labels = countries.map((item) => item.country);

    if (riskChart) riskChart.destroy();

    const gradient = riskChartCanvas
      .getContext("2d")
      .createLinearGradient(0, 0, riskChartCanvas.width, 0);
    gradient.addColorStop(0, "rgba(255, 99, 132, 0.8)");
    gradient.addColorStop(1, "rgba(200, 50, 100, 0.8)");

    riskChart = new Chart(riskChartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Jeopolitik Risk/10",
            data: risks,
            backgroundColor: gradient,
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            borderRadius: 10,
          },
          {
            type: "line",
            label: "Ortalama Risk",
            data: Array(labels.length).fill(averageRisk),
            borderColor: "blue",
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            ticks: {
              color: "black",
              font: {
                size: 12,
                weight: "normal",
              },
            },
          },
        },
      },
    });
  }

  function fetchRiskData(regionId, trendCountries) {
    const countryNames = trendCountries.map((country) => country.country);

    fetch(
      `/api/anasayfa/risk?region=${regionId}&countries=${JSON.stringify(
        countryNames
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Filtered Risk Data:", data);

        if (data.countries && data.averageRisk !== undefined) {
          initializeRiskChart(data.countries, data.averageRisk);
        } else {
          console.error("Invalid risk chart data:", data);
        }
      })
      .catch((error) => console.error("Risk Chart Fetch Error:", error));
  }

  function fetchComparisonData(regionId, platformId, productId) {
    fetch(
      `/api/anasayfa/comparison?region=${regionId}&platform=${platformId}&product=${productId}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Comparison Data:", data);

        if (data.comparisonResult && data.comparisonResult.length > 0) {
          initializeComparisonChart(data.comparisonResult);
        } else {
          console.warn("Comparison Result is empty:", data.comparisonResult);
        }

        console.log("Trend Average Score:", data.trendAverage);
        console.log("Risk Average Score:", data.riskAverage);
      })
      .catch((error) => console.error("Comparison Fetch Error:", error));
  }

  function initializeComparisonChart(comparisonData) {
    const sortedData = [...comparisonData].sort((a, b) => b.score - a.score);

    const labels = sortedData.map((item) => item.country);
    const scores = sortedData.map((item) => item.score);

    if (comparisonChart) comparisonChart.destroy();

    const gradient = comparisonChartCanvas
      .getContext("2d")
      .createLinearGradient(0, 0, comparisonChartCanvas.width, 0);
    gradient.addColorStop(0, "rgba(64, 224, 208, 0.8)");
    gradient.addColorStop(1, "rgba(0, 128, 128, 0.8)");

    comparisonChart = new Chart(comparisonChartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Yönelim Skoru/100",
            data: scores,
            backgroundColor: gradient,
            borderColor: "rgba(0, 128, 128, 1)",
            borderWidth: 1,
            borderRadius: 10,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: "black",
              font: {
                size: 12,
                weight: "normal",
              },
            },
          },
          y: {
            ticks: {
              color: "black",
              font: {
                size: 12,
                weight: "normal",
              },
            },
          },
        },
      },
    });
  }
    // Modern pencere stili uygula
    document.querySelectorAll(".chart-container").forEach((container) => {
      container.style.border = "1px solid #ccc";
      container.style.borderRadius = "10px";
      container.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
      container.style.padding = "20px";
      container.style.marginBottom = "20px";
      container.style.backgroundColor = "#f9f9f9";
    });
});
