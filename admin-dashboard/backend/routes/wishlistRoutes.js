const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');

// ✅ Tạo wishlist mới cho user
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;

    const existing = await Wishlist.findOne({ userId });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newWishlist = new Wishlist({ userId, items: [] });
    await newWishlist.save();

    res.status(201).json(newWishlist);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo wishlist', error: err.message });
  }
});

// ✅ Lấy wishlist theo userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ message: 'Không tìm thấy wishlist' });
    }
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy wishlist', error: err.message });
  }
});

// Thêm sản phẩm vào wishlist theo userId
router.post('/user/:userId/items', async (req, res) => {
  const { userId } = req.params;
  const { productId, name, image, price } = req.body;
  try {
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    if (wishlist.items.find(item => item.productId === productId)) {
      return res.status(400).json({ message: 'Sản phẩm đã có trong wishlist' });
    }

    wishlist.items.push({ productId, name, image, price });
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: err.message });
  }
});


// ✅ Xóa sản phẩm khỏi wishlist
router.delete('/:wishlistId/items/:productId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findById(req.params.wishlistId);
    if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

    wishlist.items = wishlist.items.filter(
      (item) => item.productId !== req.params.productId
    );
    await wishlist.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: err.message });
  }
});

router.post('/toggle', async (req, res) => {
  try {
    const { userId, product } = req.body; // product = { productId, name, image, price }
    
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const index = wishlist.items.findIndex(
      item => item.productId.toString() === product.productId.toString()
    );

    if (index > -1) {
      // Nếu đã có trong wishlist thì xóa đi (unfavorite)
      wishlist.items.splice(index, 1);
    } else {
      // Thêm mới
      wishlist.items.push(product);
    }

    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi toggle sản phẩm yêu thích', error: err.message });
  }
});


module.exports = router;
