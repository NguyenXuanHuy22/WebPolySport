const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

//  Thêm sản phẩm mới
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },          // ảnh chính
    { name: "extraImages", maxCount: 10 }    // nhiều ảnh phụ
  ]),
  async (req, res) => {
    try {
      const { name, category, originalPrice, salePrice, description, status, variants } = req.body;

      let parsedVariants = [];
      if (variants) {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      }

      // Ảnh chính
      let base64Image = "";
      if (req.files?.image?.[0]) {
        base64Image = `data:${req.files.image[0].mimetype};base64,${req.files.image[0].buffer.toString("base64")}`;
      }

      // Ảnh phụ
      let base64ExtraImages = [];
      if (req.files?.extraImages) {
        base64ExtraImages = req.files.extraImages.map(file =>
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        );
      }

      const newProduct = new Product({
        name,
        category,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        // ⚡ Nếu không nhập hoặc nhập 0 thì để null
        salePrice: salePrice && Number(salePrice) > 0 ? Number(salePrice) : null,
        description,
        status,
        variants: parsedVariants,
        image: base64Image,
        extraImages: base64ExtraImages
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (err) {
      console.error("Lỗi khi thêm sản phẩm:", err);
      res.status(500).json({ message: "Lỗi khi thêm sản phẩm", error: err.message });
    }
  }
);


//  Lấy tất cả sản phẩm
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm', error: err.message });
  }
});

//  Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết sản phẩm', error: err.message });
  }
});

// Cập nhật sản phẩm
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },          // ảnh chính
    { name: "extraImages", maxCount: 10 },   // nhiều ảnh phụ
  ]),
  async (req, res) => {
    try {
      const existingProduct = await Product.findById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      let updateData = {
        name: req.body.name || existingProduct.name,
        category: req.body.category || existingProduct.category,
        originalPrice: req.body.originalPrice
          ? Number(req.body.originalPrice)
          : existingProduct.originalPrice,

        // ✅ Chuẩn hóa salePrice
        salePrice:
          req.body.salePrice && Number(req.body.salePrice) > 0
            ? Number(req.body.salePrice)
            : null,

        description: req.body.description || existingProduct.description,
        status: req.body.status || existingProduct.status,
        variants: req.body.variants
          ? typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants
          : existingProduct.variants,
        image: existingProduct.image,
        extraImages: existingProduct.extraImages, // giữ lại mảng cũ mặc định
      };

      // Nếu upload ảnh chính mới
      if (req.files?.image?.[0]) {
        updateData.image = `data:${
          req.files.image[0].mimetype
        };base64,${req.files.image[0].buffer.toString("base64")}`;
      } else if (req.body.image && req.body.image !== existingProduct.image) {
        updateData.image = req.body.image;
      }

      // Nếu có upload thêm ảnh phụ mới
      if (req.files?.extraImages) {
        const uploadedExtraImages = req.files.extraImages.map((file) =>
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        );

        // 👉 GỘP thêm vào danh sách ảnh cũ
        updateData.extraImages = [
          ...existingProduct.extraImages,
          ...uploadedExtraImages,
        ];

        // 🔄 Nếu muốn THAY THẾ toàn bộ ảnh phụ cũ:
        // updateData.extraImages = uploadedExtraImages;
      } else if (req.body.extraImages) {
        updateData.extraImages =
          typeof req.body.extraImages === "string"
            ? JSON.parse(req.body.extraImages)
            : req.body.extraImages;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updatedProduct);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật sản phẩm:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật sản phẩm", error: err.message });
    }
  }
);

module.exports = router;
