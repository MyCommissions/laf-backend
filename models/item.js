const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Umbrella", "Wallet", "Cash", "Phone", "ID", "Others"],
    },
    imageUrl: {
      type: String,
    },
    moneyAmount: {
      type: Number,
      default: 0,
    },
    itemSize: {
      type: String,
      enum: ["Small", "Medium", "Large"],
    },
    itemColor: {
      type: String,
      enum: ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet", "Black", "White"],
    },
    brandType: {
      type: String,
    },
    uniqueIdentifier: {
      type: String,
    },
    remarks: {
      type: String,
    },
    found: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;