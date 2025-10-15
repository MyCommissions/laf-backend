const mongoose = require("mongoose");

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

    // 🟢 Added claim information (does NOT replace existing fields)
    claimInfo: {
      imageUuid: {
        type: String,
        default: null,
      },
      contactNumber: {
        type: String,
        default: null,
      },
      firstName: {
        type: String,
        default: null,
      },
      lastName: {
        type: String,
        default: null,
      },
      timeOfClaim: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true, versionKey: false }
);

const MatchedItem = mongoose.model("MatchedItem", matchedItemSchema);

module.exports = MatchedItem;