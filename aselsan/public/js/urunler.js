document.addEventListener("DOMContentLoaded", () => {
  const platformSelect = document.getElementById("platform-select");
  const urunSelect1 = document.getElementById("urun-select-1");
  const urunSelect2 = document.getElementById("urun-select-2");
  const compareButton = document.getElementById("compare-button");
  const urunFotografi1 = document.getElementById("urun-fotografi-1");
  const urunFotografi2 = document.getElementById("urun-fotografi-2");
  const urunAdi1 = document.getElementById("urun-adi-1");
  const urunAdi2 = document.getElementById("urun-adi-2");
  const barChart1 = document.getElementById("barChart").getContext("2d");

  let barChartInstance1 = null;

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

  const loadPlatforms = async () => {
    const data = await fetchData("/api/urunler/platforms");
    if (data) {
      platformSelect.innerHTML =
        '<option value="" disabled selected>Bir platform seçin</option>';
      data.forEach((platform) => {
        const option = document.createElement("option");
        option.value = platform.platform_id;
        option.textContent = platform.platform_ad;
        platformSelect.appendChild(option);
      });
    } else {
      console.error("Platformlar yüklenemedi.");
    }
  };

  const loadProducts = async (platformId) => {
    urunSelect1.innerHTML =
      '<option value="" disabled selected>Bir ürün seçin</option>';
    urunSelect2.innerHTML =
      '<option value="" disabled selected>Bir ürün seçin</option>';
    urunSelect1.disabled = true;
    urunSelect2.disabled = true;

    const data = await fetchData(
      `/api/urunler/products?platform_id=${platformId}`
    );
    if (data) {
      data.forEach((urun) => {
        const option1 = document.createElement("option");
        option1.value = urun.urun_id;
        option1.textContent = urun.urun_ad;
        urunSelect1.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = urun.urun_id;
        option2.textContent = urun.urun_ad;
        urunSelect2.appendChild(option2);
      });
      urunSelect1.disabled = false;
      urunSelect2.disabled = false;
    } else {
      console.error("Ürünler yüklenemedi.");
    }
  };

  const loadProductData = async (urunId1, urunId2) => {
    const data1 = await fetchData(
      `/api/urunler/product-charts?urun_id=${urunId1}`
    );
    const data2 = await fetchData(
      `/api/urunler/product-charts?urun_id=${urunId2}`
    );

    if (data1 && data2) {
      // Ürün fotoğraflarını ayarla
      urunFotografi1.src = `/images/${data1.urun_ad}.png`;
      urunFotografi1.onerror = () => {
        urunFotografi1.src = "/images/default.png";
      };

      urunFotografi2.src = `/images/${data2.urun_ad}.png`;
      urunFotografi2.onerror = () => {
        urunFotografi2.src = "/images/default.png";
      };

      // Ürün adlarını ayarla
      urunAdi1.textContent = data1.urun_ad;
      urunAdi2.textContent = data2.urun_ad;

      // Grafik verilerini yükle
      if (barChartInstance1) barChartInstance1.destroy();

      const labels = data1.labels;
      const scores1 = data1.yonelim;
      const scores2 = data2.yonelim;

      barChartInstance1 = new Chart(barChart1, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: data1.urun_ad,
              data: scores1,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
            {
              label: data2.urun_ad,
              data: scores2,
              backgroundColor: "rgba(255, 99, 132, 0.6)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true, // Grafik boyutlandırmayı desteklesin
          maintainAspectRatio: true, // Oran koruma açık
          aspectRatio: 2, // Grafik boyutu ayarı (genişlik/yükseklik oranı)
          plugins: {
            title: {
              display: true,
              text: "Ürünlerin Ülkelere Göre Karşılaştırması",
              font: {
                size: 18,
                weight: "bold",
              },
              color: "#003087",
            },
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.raw}`;
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Ülkeler",
                color: "#003087",
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
            },
            y: {
              title: {
                display: true,
                text: "Yönelim Skoru",
                color: "#003087",
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
              beginAtZero: true,
            },
          },
        },
      });
    }
  };

  platformSelect.addEventListener("change", () => {
    const platformId = platformSelect.value;
    loadProducts(platformId);
  });

  compareButton.addEventListener("click", () => {
    const urunId1 = urunSelect1.value;
    const urunId2 = urunSelect2.value;
    if (urunId1 && urunId2) {
      loadProductData(urunId1, urunId2);
    }
  });

  loadPlatforms();
});
