const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const Address = require('../models/Address');

// --- Lấy danh sách địa chỉ theo userId ---
router.get('/:userId', async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.params.userId });
        res.json(addresses);
    } catch (err) {
        console.error("❌ Lỗi lấy danh sách địa chỉ:", err);
        res.status(500).json({ message: "Lỗi server khi lấy địa chỉ" });
    }
});

// --- Thêm địa chỉ mới ---
router.post('/', async (req, res) => {
    try {
        const { userId, name, address, phone } = req.body;

        if (!userId || !name || !address || !phone) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }

        const newAddress = await Address.create({ userId, name, address, phone });
        res.status(201).json(newAddress);
    } catch (err) {
        console.error("❌ Lỗi thêm địa chỉ:", err);
        res.status(500).json({ message: "Lỗi server khi thêm địa chỉ" });
    }
});

// --- Cập nhật địa chỉ ---
router.put('/:id', async (req, res) => {
    try {
        const { name, address, phone } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(
            req.params.id,
            { $set: { name, address, phone } },
            { new: true, runValidators: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ để cập nhật" });
        }

        res.json(updatedAddress);
    } catch (err) {
        console.error("❌ Lỗi cập nhật địa chỉ:", err);
        res.status(500).json({ message: "Lỗi server khi cập nhật địa chỉ" });
    }
});

// --- Xóa địa chỉ ---
router.delete('/:id', async (req, res) => {
    try {
        const deletedAddress = await Address.findByIdAndDelete(req.params.id);

        if (!deletedAddress) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ để xóa" });
        }

        res.json({ message: "Xóa địa chỉ thành công" });
    } catch (err) {
        console.error("❌ Lỗi xóa địa chỉ:", err);
        res.status(500).json({ message: "Lỗi server khi xóa địa chỉ" });
    }
});

module.exports = router;
