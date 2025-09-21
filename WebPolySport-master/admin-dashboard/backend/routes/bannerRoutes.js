const express = require("express");
const Banner = require("../models/Banner");

const router = express.Router();

// Lấy tất cả banner
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thêm banner mới (lưu base64)
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Vui lòng chọn ảnh" });

    const banner = new Banner({ image });
    const savedBanner = await banner.save();
    res.status(201).json(savedBanner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xóa banner
router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });

    res.json({ message: "Xóa banner thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
