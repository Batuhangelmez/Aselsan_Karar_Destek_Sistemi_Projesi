const express = require("express");
const router = express.Router();
const db = require("../models/db");

// Tüm kıtaları getir
router.get("/kitalar", (req, res) => {
  const sql = "SELECT DISTINCT ulke_bolge AS region FROM ulke";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json(results);
  });
});

// Seçilen kıtaya ait ülkeleri getir
router.get("/ulkeler/:region", (req, res) => {
  const region = req.params.region;
  const sql = "SELECT ulke_ad AS name FROM ulke WHERE ulke_bolge = ?";
  db.query(sql, [region], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json(results);
  });
});

// Ülkenin konum bilgilerini getir
router.get("/konum/:country", (req, res) => {
  const country = req.params.country;
  const sql =
    "SELECT ST_X(ulke_konum) AS latitude, ST_Y(ulke_konum) AS longitude FROM ulke WHERE ulke_ad = ?";
  db.query(sql, [country], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Ülke bulunamadı" });
    }
    res.json(results[0]);
  });
});

// Seçilen ülkenin ürün bilgilerini getir
router.get("/urunler/:country", (req, res) => {
  const country = req.params.country;
  const sql = `
    SELECT u.urun_ad, uu.yonelim_skoru
    FROM ulke_urun uu
    JOIN urun u ON uu.urun_id = u.urun_id
    WHERE uu.ulke_id = (SELECT ulke_id FROM ulke WHERE ulke_ad = ?)
  `;
  db.query(sql, [country], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json(results);
  });
});
// Ülkenin savunma bütçesi bilgilerini getir
router.get("/budget/:country", (req, res) => {
  const country = req.params.country;
  const sql = "SELECT savunma_butce AS budget FROM ulke WHERE ulke_ad = ?";
  db.query(sql, [country], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Ülke bulunamadı" });
    }
    res.json(results[0]);
  });
});
router.get("/risk/:country", (req, res) => {
  const country = req.params.country;
  const sql =
    "SELECT jeopolitik_risk FROM faktorler JOIN ulke ON faktorler.ulke_id = ulke.ulke_id WHERE ulke.ulke_ad = ?";
  db.query(sql, [country], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Ülke bulunamadı" });
    }
    const riskValue = parseFloat(results[0].jeopolitik_risk); // String değeri sayıya dönüştür
    res.json({ jeopolitik_risk: riskValue });
  });
});


module.exports = router;
