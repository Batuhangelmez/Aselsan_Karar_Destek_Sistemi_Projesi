// script.js

// Dropdown elemanlarını seç
const countrySelect = document.getElementById("country-select");
const continentSelect = document.getElementById("continent-select");

// Harita ve grafik alanları için placeholder öğeleri seç
const mapArea = document.querySelector(".map-area p");
const pieChart = document.querySelector(".pie-chart p");
const histogram = document.querySelector(".histogram p");
const budget = document.querySelector(".budget p");

// Ülke seçimi değiştiğinde çağrılacak fonksiyon
countrySelect.addEventListener("change", (e) => {
  const country = e.target.value;

  if (country) {
    mapArea.textContent = `${country.toUpperCase()} ülkesine ait harita veya grafik.`;
    pieChart.textContent = `${country.toUpperCase()} ülkesinin yönelim dağılımı.`;
    histogram.textContent = `${country.toUpperCase()} ülkesine ait ürün ve yönelim skorları.`;
    budget.textContent = `${country.toUpperCase()} ülkesinin savunma bütçesi.`;
  } else {
    resetContent();
  }
});

// Kıta seçimi değiştiğinde çağrılacak fonksiyon
continentSelect.addEventListener("change", (e) => {
  const continent = e.target.value;

  if (continent) {
    mapArea.textContent = `${continent.toUpperCase()} kıtasına ait harita veya grafik.`;
    pieChart.textContent = `${continent.toUpperCase()} kıtasındaki ülkelerin yönelim dağılımı.`;
    histogram.textContent = `${continent.toUpperCase()} kıtasındaki ürün ve yönelim skorları.`;
    budget.textContent = `${continent.toUpperCase()} kıtasındaki savunma bütçeleri.`;
  } else {
    resetContent();
  }
});

// İçerikleri sıfırlama fonksiyonu
function resetContent() {
  mapArea.textContent =
    "Dünya haritası veya dünya haritası grafiği burada olacak";
  pieChart.textContent = "Pasta grafiği: Seçilen ülkenin yönelim dağılımı";
  histogram.textContent = "Sütun grafiği: Ürünler ve yönelim skorları";
  budget.textContent = "Savunma bütçesi grafiği";
}
