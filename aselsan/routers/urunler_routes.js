const express = require("express");
const router = express.Router();
const db = require("../models/db");

// Platformları getir
router.get("/platforms", (req, res) => {
  const sql = "SELECT platform_id, platform_ad FROM platform";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json(results);
  });
});

// Seçilen platformdaki ürünleri getir
router.get("/products", (req, res) => {
  const platformId = req.query.platform_id;
  console.log("Platform ID:", platformId); // Gelen ID'yi kontrol edin
  if (!platformId) {
    return res.status(400).json({ error: "Platform ID gerekli" });
  }

  const sql = "SELECT urun_id, urun_ad FROM urun WHERE platform_id = ?";
  db.query(sql, [platformId], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    if (results.length === 0) {
      console.warn("Ürün bulunamadı:", platformId);
      return res
        .status(404)
        .json({ error: "Bu platform için ürün bulunamadı" });
    }
    console.log("Dönen ürünler:", results);
    res.json(results);
  });
});

// Ürün verilerini getir
router.get("/product-charts", (req, res) => {
  const urunId = req.query.urun_id;
  if (!urunId) {
    return res.status(400).json({ error: "Ürün ID gerekli" });
  }

  const sql = `
    SELECT 
      u.urun_ad, 
      ulke.ulke_ad AS label, 
      yonelim_skoru AS yonelim
    FROM ulke_urun
    JOIN ulke ON ulke_urun.ulke_id = ulke.ulke_id
    JOIN urun u ON ulke_urun.urun_id = u.urun_id
    WHERE ulke_urun.urun_id = ?`;

  db.query(sql, [urunId], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }

    const labels = results.map((row) => row.label);
    const yonelim = results.map((row) => row.yonelim);
    const urunAd = results[0].urun_ad; // Ürün adı
    res.json({ labels, yonelim, urun_ad: urunAd });
  });
});

// Bölgeleri getir
router.get("/regions", (req, res) => {
  const sql = "SELECT DISTINCT ulke_bolge FROM ulke";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json(
      results.map((row) => ({
        region_id: row.ulke_bolge,
        region_name: row.ulke_bolge,
      }))
    );
  });
});

// Belirli bir bölgedeki ülkeleri getir
router.get("/region-data", (req, res) => {
  const region = req.query.region;
  if (!region) {
    return res.status(400).json({ error: "Bölge parametresi gerekli." });
  }

  const sql =
    "SELECT ulke.ulke_ad AS UlkeAdi, ulke_urun.yonelim_skoru AS YonelimSkoru FROM ulke JOIN ulke_urun ON ulke.ulke_id = ulke_urun.ulke_id WHERE ulke.ulke_bolge = ?";
  db.query(sql, [region], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı sorgu hatası" });
    }
    res.json({ countries: results });
  });
});

module.exports = router;
