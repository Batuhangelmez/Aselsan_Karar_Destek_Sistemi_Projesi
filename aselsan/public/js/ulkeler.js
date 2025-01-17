document.addEventListener("DOMContentLoaded", () => {
  const continentSelect = document.getElementById("continent-select");
  const countrySelect = document.getElementById("country-select");
  const selectButton = document.getElementById("select-button");
  const chartsContainer = document.getElementById("charts-container");
  const infoContainer = document.getElementById("info-container"); // Yeni bilgi kutuları için container
  const map = L.map("map", {
    minZoom: 2,
    maxZoom: 19,
    zoomControl: true,
  }).setView([20, 0], 2);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  let lastSelectedCircle = null;
  let pieChart = null;
  let barChart = null;

  // API çağrıları için yardımcı fonksiyon
  const fetchData = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API çağrısında hata: ${error.message}`);
      return null;
    }
  };

  // Bilgi kutularını güncelleme
  const updateInfoBoxes = async (country) => {
    const riskData = await fetchData(`/api/ulkeler/risk/${country}`);
    if (riskData) {
      console.log("Jeopolitik Risk:", riskData.jeopolitik_risk); // Doğrudan sayı olarak kullanılabilir
    } else {
      console.error("Jeopolitik risk verisi alınamadı.");
    }

    const budgetData = await fetchData(`/api/ulkeler/budget/${country}`);

    infoContainer.innerHTML = ""; // Eski bilgileri temizle

    const riskBox = document.createElement("div");
    riskBox.classList.add("info-box");
    riskBox.innerHTML = `
  <h3>Jeopolitik Risk</h3>
  <p>${riskData.jeopolitik_risk}/10</p>
`;
    infoContainer.appendChild(riskBox);

    const budgetBox = document.createElement("div");
    budgetBox.classList.add("info-box");
    budgetBox.innerHTML = `
      <h3>Savunma Bütçesi($)</h3>
      <p>${budgetData ? budgetData.budget : "Bilgi yok"}</p>
    `;

    infoContainer.appendChild(riskBox);
    infoContainer.appendChild(budgetBox);
  };

  // Kıtaları Dinamik Olarak Doldur
  const loadContinents = async () => {
    const data = await fetchData("/api/ulkeler/kitalar");
    if (data) {
      continentSelect.innerHTML =
        '<option value="" disabled selected>Bölge seçin</option>';
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.region;
        option.textContent = item.region;
        continentSelect.appendChild(option);
      });
    } else {
      console.error("Kıtalar yüklenirken hata.");
    }
  };

  // Ülke Listesini Yükle
  const loadCountries = async (region) => {
    const data = await fetchData(`/api/ulkeler/ulkeler/${region}`);
    if (data) {
      countrySelect.innerHTML =
        '<option value="" disabled selected>Bir ülke seçin</option>';
      data.forEach((country) => {
        const option = document.createElement("option");
        option.value = country.name;
        option.textContent = country.name;
        countrySelect.appendChild(option);
      });
    } else {
      console.error("Ülkeler yüklenirken hata.");
    }
  };

  // Ülke Konumunu Haritada Göster
  const showCountryOnMap = async (country) => {
    const data = await fetchData(`/api/ulkeler/konum/${country}`);
    if (data) {
      const { latitude, longitude } = data;

      // Önceki seçili ülke işaretçisini kaldır
      if (lastSelectedCircle) {
        map.removeLayer(lastSelectedCircle);
      }

      // Yeni işaretçiyi ekle
      lastSelectedCircle = L.circle([latitude, longitude], {
        color: "orange",
        fillColor: "#ffa500",
        fillOpacity: 0.5,
        radius: 50000,
      }).addTo(map);

      map.setView([latitude, longitude], 6);
    } else {
      console.error("Konum bilgisi yüklenirken hata.");
    }
  };

  // Pasta Grafiğini Modernize Etme
  const initializePieChart = (data) => {
    const ctx = document.getElementById("pieChart").getContext("2d");

    const colors = [
      "#FFB6C1",
      "#FFCC99",
      "#99CCFF",
      "#D4EDDA",
      "#FFFACD",
      "#B39DDB",
      "#FFAB91",
      "#80DEEA",
      "#FFEB3B",
      "#C5E1A5",
      "#E57373",
      "#BA68C8",
      "#FFD54F",
      "#A1887F",
      "#90A4AE",
      "#F06292",
      "#4DB6AC",
    ];

    let filteredData = data.scores
      .map((score, index) => ({
        score: parseFloat(score),
        label: data.labels[index],
      }))
      .filter((item) => item.score > 0);

    const total = filteredData.reduce((sum, item) => sum + item.score, 0);

    console.log("Filtered Data:", filteredData);
    console.log("Total Score:", total);

    if (filteredData.length === 0 || total === 0) {
      console.error("Geçerli veri bulunamadı, grafik oluşturulamadı.");
      return;
    }

    filteredData = filteredData.sort((a, b) => b.score - a.score);

    const percentages = filteredData.map((item) => {
      const percentage = (item.score / total) * 100;
      return isNaN(percentage) ? 0 : percentage.toFixed(2);
    });

    console.log("Percentages:", percentages);

    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: filteredData.map(
          (item, index) => `${item.label} (${percentages[index]}%)`
        ),
        datasets: [
          {
            data: filteredData.map((item) => item.score),
            backgroundColor: colors.slice(0, filteredData.length),
            borderColor: "#FFFFFF",
            borderWidth: 2,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#333",
              font: {
                size: 12,
                family: "Arial",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.raw} puan`;
              },
            },
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            titleColor: "#FFF",
            bodyColor: "#FFF",
          },
        },
        layout: {
          padding: 20,
        },
      },
    });
  };

  // Sütun Grafiğini Modernize Etme
  const initializeBarChart = (data) => {
    const ctx = document.getElementById("barChart").getContext("2d");

    let filteredData = data.scores
      .map((score, index) => ({
        score: parseFloat(score),
        label: data.labels[index],
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const colors = filteredData.map(
      (_, index) => `hsl(${index * 20}, 70%, 60%)`
    );

    barChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: filteredData.map((item) => item.label),
        datasets: [
          {
            label: "Yönelim Skoru",
            data: filteredData.map((item) => item.score),
            backgroundColor: colors,
            borderColor: "#FFFFFF",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
            },
          },
          y: {
            ticks: {
              callback: function (value) {
                return value;
              },
              font: {
                size: 14,
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },
      },
    });
  };

  // Ürün Bilgilerini ve Grafikleri Yükle
  const loadProductData = async (country) => {
    const data = await fetchData(`/api/ulkeler/urunler/${country}`);
    if (data && data.length > 0) {
      const labels = data.map((item) => item.urun_ad);
      const scores = data.map((item) => item.yonelim_skoru);

      // Mevcut grafik varsa sil
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();

      // Yeni Grafikler Oluştur
      initializePieChart({ labels, scores });
      initializeBarChart({ labels, scores });

      chartsContainer.classList.remove("hidden");

      // Bilgi kutularını güncelle
      updateInfoBoxes(country);
    } else {
      alert("Seçimlerinize uygun ürün bulunamadı!");
    }
  };

  // Event Listeners
  continentSelect.addEventListener("change", () => {
    const region = continentSelect.value;
    if (region) loadCountries(region);
  });

  selectButton.addEventListener("click", () => {
    const selectedCountry = countrySelect.value;
    if (!selectedCountry) {
      alert("Lütfen bir ülke seçin!");
      return;
    }

    showCountryOnMap(selectedCountry);
    loadProductData(selectedCountry);
  });

  // Sayfa yüklendiğinde kıtaları yükle
  loadContinents();
});
