const express = require("express");
const mysql = require("mysql2");
const router = express.Router();

// Bu modül için özel veritabanı bağlantısı
const db = mysql
  .createPool({
    host: "localhost", // Veritabanı sunucusu
    user: "root", // Kullanıcı adı
    password: "", // Şifre
    database: "aselsan", // Veritabanı adı
  })
  .promise(); // Promise tabanlı bağlantı

// Bölge listesini döndüren endpoint
router.get("/regions", async (req, res) => {
  try {
    const [regions] = await db.query(
      "SELECT DISTINCT ulke_bolge AS name FROM ulke"
    );
    console.log("Regions Query Result:", regions);
    res.json(regions);
  } catch (error) {
    console.error("Regions API Error:", error.message);
    res.status(500).json({ error: "Bölgeler yüklenirken hata oluştu." });
  }
});

// Platform listesini döndüren endpoint
router.get("/platforms", async (req, res) => {
  try {
    const [platforms] = await db.query(
      "SELECT platform_id AS id, platform_ad AS name FROM platform"
    );
    console.log("Platforms Query Result:", platforms);
    res.json(platforms);
  } catch (error) {
    console.error("Platforms API Error:", error.message);
    res.status(500).json({ error: "Platformlar yüklenirken hata oluştu." });
  }
});

// Ürün listesini döndüren endpoint
router.get("/products", async (req, res) => {
  const { platform } = req.query;

  try {
    let query = "SELECT urun_id AS id, urun_ad AS name FROM urun";
    const params = [];
    if (platform) {
      query += " WHERE platform_id = ?";
      params.push(platform);
    }
    const [products] = await db.query(query, params);
    res.json(products);
  } catch (error) {
    console.error("Products API Error:", error.message);
    res.status(500).json({ error: "Ürünler yüklenirken hata oluştu." });
  }
});

// Trend grafiği verileri
router.get("/trend", async (req, res) => {
  const { region, platform, product } = req.query;

  try {
    const [countries] = await db.query(
      `SELECT u.ulke_ad AS country, COALESCE(uu.yonelim_skoru, 0) AS score 
       FROM ulke u 
       JOIN ulke_urun uu ON u.ulke_id = uu.ulke_id 
       WHERE u.ulke_bolge = ? AND uu.urun_id = ? AND uu.ulke_id IN (
         SELECT e.ulke_id FROM envanter e WHERE e.platform_id = ?
       )`,
      [region, product, platform]
    );

    // score değerlerini number formatına çeviriyoruz
    let averageScore = 0;
    if (countries.length > 0) {
      averageScore =
        countries.reduce((sum, item) => sum + parseFloat(item.score || 0), 0) /
        countries.length;
    }

    console.log("Countries Data (Trend):", countries);
    console.log("Average Score:", averageScore);

    res.json({ countries, averageScore });
  } catch (error) {
    console.error("Trend API Error:", error.message);
    res
      .status(500)
      .json({ error: "Yönelim skoru verileri yüklenirken hata oluştu." });
  }
});

// Risk grafiği verileri
router.get("/risk", async (req, res) => {
  const { region, countries } = req.query;

  try {
    const countryList = JSON.parse(countries || "[]");

    if (countryList.length === 0) {
      return res.status(400).json({ error: "Ülke listesi boş!" });
    }

    const [riskCountries] = await db.query(
      `SELECT u.ulke_ad AS country, COALESCE(f.jeopolitik_risk, 0) AS risk 
       FROM ulke u 
       JOIN faktorler f ON u.ulke_id = f.ulke_id 
       WHERE u.ulke_bolge = ? AND u.ulke_ad IN (${countryList.map(() => "?").join(",")})`,
      [region, ...countryList]
    );

    const risks = riskCountries.map((item) => parseFloat(item.risk || 0)); // Null değerleri 0 olarak al
    const averageRisk =
      risks.length > 0
        ? risks.reduce((sum, value) => sum + value, 0) / risks.length
        : 0; // Eğer dizi boşsa ortalama 0 olarak ayarlanır

    console.log("Filtered Risk Countries:", riskCountries);
    console.log("Risk Values:", risks);
    console.log("Risk Average Score:", averageRisk);

    res.json({ countries: riskCountries, averageRisk });
  } catch (error) {
    console.error("Risk API Error:", error.message);
    res
      .status(500)
      .json({ error: "Jeopolitik risk verileri yüklenirken hata oluştu." });
  }
});

// Karşılaştırma
router.get("/comparison", async (req, res) => {
  const { region, platform, product } = req.query;

  try {
    const [trendCountries] = await db.query(
      `SELECT u.ulke_ad AS country, COALESCE(uu.yonelim_skoru, 0) AS score 
       FROM ulke u 
       JOIN ulke_urun uu ON u.ulke_id = uu.ulke_id 
       WHERE u.ulke_bolge = ? AND uu.urun_id = ? AND uu.ulke_id IN (
         SELECT e.ulke_id FROM envanter e WHERE e.platform_id = ?
       )`,
      [region, product, platform]
    );

    const trendAverage =
      trendCountries.length > 0
        ? trendCountries.reduce(
            (sum, item) => sum + parseFloat(item.score || 0),
            0
          ) / trendCountries.length
        : 0;

    const [riskCountries] = await db.query(
      `SELECT u.ulke_ad AS country, COALESCE(f.jeopolitik_risk, 0) AS risk 
       FROM ulke u 
       JOIN faktorler f ON u.ulke_id = f.ulke_id 
       WHERE u.ulke_bolge = ?`,
      [region]
    );

    const riskAverage =
      riskCountries.length > 0
        ? riskCountries.reduce(
            (sum, item) => sum + parseFloat(item.risk || 0),
            0
          ) / riskCountries.length
        : 0;

    // Detaylı eşleşme kontrolü
    const comparisonResult = trendCountries
      .filter((trend) => {
        const matchingRisk = riskCountries.find(
          (risk) =>
            risk.country.trim().toLowerCase() ===
            trend.country.trim().toLowerCase()
        );
        if (!matchingRisk) {
          console.log(`No match for ${trend.country} in riskCountries.`);
        }
        return (
          trend.score > trendAverage &&
          matchingRisk &&
          matchingRisk.risk < riskAverage
        );
      })
      .sort((a, b) => b.score - a.score);

    console.log("Trend Countries:", trendCountries);
    console.log("Risk Countries:", riskCountries);
    console.log("Trend Average Score:", trendAverage);
    console.log("Risk Average Score:", riskAverage);
    console.log("Comparison Result:", comparisonResult);

    res.json({ comparisonResult, trendAverage, riskAverage });
  } catch (error) {
    console.error("Comparison API Error:", error.message);
    res
      .status(500)
      .json({ error: "Ülkeler karşılaştırılması sırasında hata oluştu." });
  }
});

module.exports = router;
