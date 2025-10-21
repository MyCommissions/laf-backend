const MatchedItem = require("../models/matchedItem");
const Item = require("../models/item");
const { sendEmail } = require('../services/email.service');

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
    const lostItems = await Item.find({ found: false, matched: false });
    for (let lost of lostItems) {
      if (isMatch(lost, item)) {
        const pendingRecord = await MatchedItem.findOne({
          lostItem: lost._id,
          status: "pending",
        });

        matched = await MatchedItem.findOneAndUpdate(
          { lostItem: lost._id, foundItem: item._id },
          { status: "matched" },
          { new: true, upsert: true }
        )
          .populate("lostItem")
          .populate("foundItem"); // populate so we can access emails

        if (matched.status === "matched") {
          await Item.findByIdAndUpdate(item._id, { matched: true });
          await Item.findByIdAndUpdate(lost._id, { matched: true });

          // 📧 Email both parties
          if (matched.lostItem?.email) {
            await sendEmail(
              matched.lostItem.email,
              "Possible Match Found",
              `Hi ${matched.lostItem.firstName || "there"}, 
              We found a possible match for your lost item (${
                matched.lostItem.category
              }). 
              Please log in to review and confirm.`
            );
          }

          if (matched.foundItem?.email) {
            await sendEmail(
              matched.foundItem.email,
              "Possible Match Found",
              `Hi ${matched.foundItem.firstName || "there"}, 
              Someone posted a lost item that matches the one you found (${
                matched.foundItem.category
              }). 
              Please log in to review and confirm.`
            );
          }
        }

        if (pendingRecord && !pendingRecord.foundItem) {
          await MatchedItem.findByIdAndDelete(pendingRecord._id);
        }

        return matched;
      }
    }
  } else {
    const foundItems = await Item.find({ found: true, matched: false });
    for (let found of foundItems) {
      if (isMatch(item, found)) {
        const pendingRecord = await MatchedItem.findOne({
          foundItem: found._id,
          status: "pending",
        });

        matched = await MatchedItem.findOneAndUpdate(
          { lostItem: item._id, foundItem: found._id },
          { status: "matched" },
          { new: true, upsert: true }
        )
          .populate("lostItem")
          .populate("foundItem");

        if (matched.status === "matched") {
          await Item.findByIdAndUpdate(found._id, { matched: true });
          await Item.findByIdAndUpdate(item._id, { matched: true });

          // 📧 Email both parties
          if (matched.lostItem?.email) {
            await sendEmail(
              matched.lostItem.email,
              "Possible Match Found",
              `Hi ${matched.lostItem.firstName || "there"}, 
              We found a possible match for your lost item (${
                matched.lostItem.category
              }). 
              Please log in to review and confirm.`
            );
          }

          if (matched.foundItem?.email) {
            await sendEmail(
              matched.foundItem.email,
              "Possible Match Found",
              `Hi ${matched.foundItem.firstName || "there"}, 
              Someone posted a lost item that matches the one you found (${
                matched.foundItem.category
              }). 
              Please log in to review and confirm.`
            );
          }
        }

        if (pendingRecord && !pendingRecord.lostItem) {
          await MatchedItem.findByIdAndDelete(pendingRecord._id);
        }

        return matched;
      }
    }
  }

  // fresh item check
  const freshItem = await Item.findById(item._id);

  if (!freshItem.matched) {
    matched = await MatchedItem.findOneAndUpdate(
      {
        lostItem: freshItem.found ? null : freshItem._id,
        foundItem: freshItem.found ? freshItem._id : null,
      },
      { status: "pending" },
      { new: true, upsert: true }
    );
  }

  return matched;
};

const claimMatchedItem = async (
  currentUser,
  matchedItemIdOrFoundItemId,
  code,
  claimInfo
) => {
  if (!currentUser) throw new Error("Please login to claim items");

  let matchedItem = await MatchedItem.findById(matchedItemIdOrFoundItemId)
    .populate("lostItem")
    .populate("foundItem");

  // 🟢 CASE 1: Found item (no match)
  if (!matchedItem) {
    const foundItem = await Item.findById(matchedItemIdOrFoundItemId);
    if (!foundItem || !foundItem.found)
      throw new Error("Item not found or not a found item");

    if (foundItem.claimed)
      throw new Error("This found item has already been claimed");
    if (foundItem.matched)
      throw new Error(
        "This item is already matched; please claim through matched list"
      );
    if (!code) throw new Error("Pin code is required");
    if (code !== "111111") throw new Error("Pin code is not valid");

    // 🟢 Mark claimed
    await foundItem.updateOne({ claimed: true });

    // ✅ Store claim info (optional: could be stored in Item model as well)
    const time = claimInfo.timeOfClaim
      ? new Date(claimInfo.timeOfClaim)
      : new Date();

    // 📧 Notify
    if (foundItem.email) {
      await sendEmail(
        foundItem.email,
        "Found Item Claimed",
        `Hi ${foundItem.firstName}, your found item (${foundItem.category}) has been successfully claimed.`
      );
    }

    return {
      status: "claimed",
      foundItem,
      claimInfo: {
        ...claimInfo,
        timeOfClaim: time,
      },
    };
  }

  // 🟢 CASE 2: Matched item
  if (matchedItem.status !== "matched") {
    throw new Error("Item is not available for claiming");
  }
  if (!code) throw new Error("Pin code is required");
  if (code !== "111111") throw new Error("Pin code is not valid");

  const lostItem = await Item.findById(matchedItem.lostItem);
  const foundItem = await Item.findById(matchedItem.foundItem);

  await lostItem.updateOne({ claimed: true, matched: true });
  await foundItem.updateOne({ claimed: true, matched: true });

  matchedItem.status = "claimed";
  matchedItem.claimedBy = currentUser._id;
  matchedItem.claimInfo = {
    firstName: claimInfo.firstName,
    lastName: claimInfo.lastName,
    contactNumber: claimInfo.contactNumber,
    timeOfClaim: claimInfo.timeOfClaim || new Date(),
    imageUuid: claimInfo.imageUuid || null,
  };

  await matchedItem.save();

  // 📧 Notify users
  if (matchedItem.lostItem?.email) {
    await sendEmail(
      matchedItem.lostItem.email,
      "Lost Item Claimed",
      `Hi ${matchedItem.lostItem.firstName}, your lost item (${matchedItem.lostItem.category}) has been successfully claimed.`
    );
  }

  if (matchedItem.foundItem?.email) {
    await sendEmail(
      matchedItem.foundItem.email,
      "Found Item Claimed",
      `Hi ${matchedItem.foundItem.firstName}, the item you posted as found (${matchedItem.foundItem.category}) has been successfully claimed.`
    );
  }

  return matchedItem;
};

const getMatchedItems = async () => {
  return await MatchedItem.find({ status: "matched" })
    .populate("lostItem")
    .populate("foundItem")
    .sort({ createdAt: -1 });
};

const getPendingItems = async () => {
  return await MatchedItem.find({ status: "pending" })
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

const getAllMatchedAndPendingItems = async () => {
  const matchedAndPending = await MatchedItem.find({
    status: { $in: ["matched", "pending"] },
  })
    .populate("lostItem")
    .populate("foundItem");

  // Build unified list with status included
  const items = [];

  matchedAndPending.forEach((record) => {
    const status = record.status; // "matched" or "pending"

    if (record.lostItem) {
      items.push({
        ...record.lostItem.toObject(),
        status,
        type: "lost", // optional: to know which side the item belongs to
      });
    }

    if (record.foundItem) {
      items.push({
        ...record.foundItem.toObject(),
        status,
        type: "found",
      });
    }
  });

  // Sort newest first
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};


module.exports = {
  createOrUpdateMatch,
  claimMatchedItem,
  getMatchedItems,
  getPendingItems,
  getAllClaimedItem,
  getAllMatchedAndPendingItems,
};
