const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./models/db");

// Rota dosyaları
const urunler_routes = require("./routers/urunler_routes");
const ulkeler_routes = require("./routers/ulkeler_routes");
const anasayfa_routes = require("./routers/anasayfa_routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Dotenv yapılandırması
dotenv.config();

// Middleware'ler
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Statik dosyaları sun

// API rotaları
app.use("/api/ulkeler", ulkeler_routes); // Kıtalar ve ülkeler için rota
app.use("/api/urunler", urunler_routes); // Platformlar ve ürünler için rota
app.use("/api/anasayfa", anasayfa_routes); // Anasayfa için rota

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor...`);
});
