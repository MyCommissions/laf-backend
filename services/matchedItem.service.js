const MatchedItem = require("../models/matchedItem");
const Item = require("../models/item");

const isMatch = (lost, found) => {
  return (
    lost.category === found.category &&
    (!lost.itemColor ||
      !found.itemColor ||
      lost.itemColor === found.itemColor) &&
    (!lost.itemSize || !found.itemSize || lost.itemSize === found.itemSize) &&
    (!lost.brandType || !found.brandType || lost.brandType === found.brandType)
  );
};

const createOrUpdateMatch = async (item) => {
  let matched = null;

  if (item.found) {
    // new found item → check against lost items
    const lostItems = await Item.find({ found: false });
    for (let lost of lostItems) {
      if (isMatch(lost, item)) {
        matched = await MatchedItem.findOneAndUpdate(
          { lostItem: lost._id, foundItem: item._id },
          { status: "matched" },
          { new: true, upsert: true }
        );
        break;
      }
    }
  } else {
    // new lost item → check against found items
    const foundItems = await Item.find({ found: true });
    for (let found of foundItems) {
      if (isMatch(item, found)) {
        matched = await MatchedItem.findOneAndUpdate(
          { lostItem: item._id, foundItem: found._id },
          { status: "matched" },
          { new: true, upsert: true }
        );
        break;
      }
    }
  }

  if (!matched) {
    matched = await MatchedItem.findOneAndUpdate(
      {
        lostItem: item.found ? null : item._id,
        foundItem: item.found ? item._id : null,
      },
      { status: "pending" },
      { new: true, upsert: true }
    );
  }

  return matched;
};

const claimMatchedItem = async (currentUser, matchedItemId, code) => {
  if (!currentUser) throw new Error("Please login to claim items");

  const matchedItem = await MatchedItem.findById(matchedItemId);
  if (!matchedItem) throw new Error("Matched item not found");

  if (matchedItem.status !== "matched") {
    throw new Error("Item is not available for claiming");
  }

  if (!code) {
    throw new Error("Pin code is required");
  }

  if (code !== '111111') {
    throw new Error("Pin code is not valid");
  }

  matchedItem.status = "claimed";
  matchedItem.claimedBy = currentUser.userId;
  await matchedItem.save();

  return matchedItem;
};

const getMatchedItems = async () => {
  return await MatchedItem.find({ status: "matched" })
    .populate("lostItem")
    .populate("foundItem")
    .sort({ createdAt: -1 });
};

const getAllClaimedItem = async () => {
  return await MatchedItem.find({ status: "claimed" })
    .populate("lostItem")
    .populate("foundItem")
    .populate("claimedBy") // so admin can see who claimed it
    .sort({ updatedAt: -1 });
};

module.exports = {
  createOrUpdateMatch,
  claimMatchedItem,
  getMatchedItems,
  getAllClaimedItem,
};
