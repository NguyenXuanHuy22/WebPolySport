const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
