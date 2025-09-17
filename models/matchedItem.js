const mongoose = require('mongoose');

const matchedItemSchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
    status: {
      type: String,
      enum: ["pending", "matched", "claimed"],
      default: "pending",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

const MatchedItem = mongoose.model("MatchedItem", matchedItemSchema);

module.exports = MatchedItem;