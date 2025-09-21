require('dotenv').config(); // <<-- quan trọng: load .env ngay ở đầu

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// routes của bạn
const productRoutes = require('./routes/product_routes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRouter = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const AddressRoutes = require('./routes/addressRoutes');
const CommentRoutes = require('./routes/commentRoutes');
const zaloPayRoutes = require('./routes/zalopayRoutes');

const app = express();
app.use(cors());

// body parser (1 chỗ duy nhất)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// mount routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/wishlists', wishlistRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/addresses', AddressRoutes);
app.use('/api/comments', CommentRoutes);
app.use('/api/payments/zalopay', zaloPayRoutes);

// fallback route
app.get('/', (_req, res) => res.send('Server is running'));

// Start server after DB connect
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env - please set it and restart');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ MongoDB connected');

    // Check VNPay env presence (do not print secret)
    if (!process.env.VNP_TMNCODE || !process.env.VNP_HASHSECRET || !process.env.VNP_URL) {
      console.warn('.');
    } else {
      console.log(`. ${process.env.VNP_TMNCODE}, secret length: ${process.env.VNP_HASHSECRET.length}`);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
