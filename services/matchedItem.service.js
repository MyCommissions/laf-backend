const MatchedItem = require("../models/matchedItem");
const Item = require("../models/item");
const { sendEmail } = require('../services/email.service');

const sanitize = (value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }
  return value; // for numbers or undefined
};

const isMatch = (lost, found) => {
  // sanitize all comparable fields
  const lostCategory = sanitize(lost.category);
  const foundCategory = sanitize(found.category);

  const lostColor = sanitize(lost.itemColor);
  const foundColor = sanitize(found.itemColor);

  const lostSize = sanitize(lost.itemSize);
  const foundSize = sanitize(found.itemSize);

  const lostBrand = sanitize(lost.brandType);
  const foundBrand = sanitize(found.brandType);

  const lostIdentifier = sanitize(lost.uniqueIdentifier);
  const foundIdentifier = sanitize(found.uniqueIdentifier);

  return (
    // Category must match
    lostCategory === foundCategory &&
    // Item color matches or either missing
    (!lostColor || !foundColor || lostColor === foundColor) &&
    // Item size matches or either missing
    (!lostSize || !foundSize || lostSize === foundSize) &&
    // Brand type matches or either missing
    (!lostBrand || !foundBrand || lostBrand === foundBrand) &&
    // Money amount matches or either missing/zero
    (!lost.moneyAmount ||
      !found.moneyAmount ||
      lost.moneyAmount === found.moneyAmount) &&
    // Unique identifier matches or missing
    (!lostIdentifier || !foundIdentifier || lostIdentifier === foundIdentifier)
  );
};

const createOrUpdateMatch = async (item) => {
  let matched = null;

  // 🟢 CASE 1: Item is a FOUND item
  if (item.found) {
    // only consider LOST items that are not yet matched
    const lostItems = await Item.find({ found: false, matched: false });
    for (let lost of lostItems) {
      if (isMatch(lost, item)) {
        const pendingRecord = await MatchedItem.findOne({
          lostItem: lost._id,
          status: "unclaimed",
        });

        matched = await MatchedItem.findOneAndUpdate(
          { lostItem: lost._id, foundItem: item._id },
          { status: "matched" },
          { new: true, upsert: true }
        )
          .populate("lostItem")
          .populate("foundItem");

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
    // 🟢 CASE 2: Item is a LOST item
    // only consider FOUND items that are not matched AND not claimed
    const foundItems = await Item.find({
      found: true,
      matched: false,
      claimed: false, // 🚫 don't match already claimed found items
    });

    for (let found of foundItems) {
      if (isMatch(item, found)) {
        const pendingRecord = await MatchedItem.findOne({
          foundItem: found._id,
          status: "unclaimed",
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

  // 🟢 CASE 3: If no match found, create a pending record
  const freshItem = await Item.findById(item._id);

  if (!freshItem.matched) {
    matched = await MatchedItem.findOneAndUpdate(
      {
        lostItem: freshItem.found ? null : freshItem._id,
        foundItem: freshItem.found ? freshItem._id : null,
      },
      { status: "unclaimed" },
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

  // Try to find MatchedItem by ID first
  let matchedItem = await MatchedItem.findById(matchedItemIdOrFoundItemId)
    .populate("lostItem")
    .populate("foundItem");

  // 🟢 CASE 1: Claiming a FOUND ITEM directly
  if (!matchedItem) {
    const foundItem = await Item.findById(matchedItemIdOrFoundItemId);
    if (!foundItem || !foundItem.found)
      throw new Error("Item not found or not a found item");

    if (foundItem.claimed)
      throw new Error("This found item has already been claimed");

    if (!code) throw new Error("Pin code is required");
    if (code !== "111111") throw new Error("Pin code is not valid");

    const time = claimInfo.timeOfClaim
      ? new Date(claimInfo.timeOfClaim)
      : new Date();

    // 🟡 Step 1: Check if found item exists in a pending MatchedItem
    const pendingMatch = await MatchedItem.findOne({
      foundItem: foundItem._id,
      status: "unclaimed",
    });

    // 🟢 Step 2: If pending match exists, update both
    if (pendingMatch) {
      foundItem.claimed = true;
      foundItem.claimInfo = {
        firstName: claimInfo.firstName || null,
        lastName: claimInfo.lastName || null,
        contactNumber: claimInfo.contactNumber || null,
        timeOfClaim: time,
        imageUuid: claimInfo.imageUuid || null,
      };

      pendingMatch.status = "claimed";
      pendingMatch.claimedBy = currentUser._id;
      pendingMatch.claimInfo = foundItem.claimInfo;

      await foundItem.save();
      await pendingMatch.save();

      if (foundItem.email) {
        await sendEmail(
          foundItem.email,
          "Found Item Claimed",
          `Hi ${foundItem.firstName}, your found item (${foundItem.category}) has been successfully claimed.`
        );
      }

      return {
        status: "claimed (pending match updated)",
        foundItem,
        matchedItem: pendingMatch,
      };
    }

    // 🟢 Step 3: If no match record exists, handle as standalone claim
    foundItem.claimed = true;
    foundItem.claimInfo = {
      firstName: claimInfo.firstName || null,
      lastName: claimInfo.lastName || null,
      contactNumber: claimInfo.contactNumber || null,
      timeOfClaim: time,
      imageUuid: claimInfo.imageUuid || null,
    };

    await foundItem.save();

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
    };
  }

  // 🟢 CASE 2: Claiming a MATCHED ITEM
  if (matchedItem.status !== "matched")
    throw new Error("Item is not available for claiming");

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
  return await MatchedItem.find({ status: "unclaimed" })
    .populate("lostItem")
    .populate("foundItem")
    .sort({ createdAt: -1 });
};

const getAllClaimedItem = async () => {
  // 1️⃣ Get all matched items that have been claimed
  const matchedClaims = await MatchedItem.find({ status: "claimed" })
    .populate("lostItem")
    .populate("foundItem")
    .populate("claimedBy")
    .sort({ updatedAt: -1 });

  // 2️⃣ Get standalone found items that were directly claimed (not matched)
  const standaloneClaims = await Item.find({
    found: true,
    claimed: true,
    matched: false,
  }).sort({ updatedAt: -1 });

  // 3️⃣ Normalize matched claimed items
  const formattedMatched = matchedClaims.map((record) => ({
    _id: record._id,
    type: "matched",
    status: record.status,
    claimedBy: record.claimedBy,
    lostItem: record.lostItem
      ? {
          ...record.lostItem.toObject(),
          type: "lost",
        }
      : null,
    foundItem: record.foundItem
      ? {
          ...record.foundItem.toObject(),
          type: "found",
        }
      : null,
    claimInfo: record.claimInfo,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  }));

  // 4️⃣ Normalize standalone claimed found items
  const formattedStandalone = standaloneClaims.map((item) => ({
    _id: item._id,
    type: "standalone",
    status: "claimed",
    claimedBy: item.claimedBy || null,
    lostItem: null,
    foundItem: {
      ...item.toObject(),
      type: "found",
    },
    claimInfo: {
      imageUuid: null,
      contactNumber: item.contactNumber || null,
      firstName: item.firstName || null,
      lastName: item.lastName || null,
      timeOfClaim: item.updatedAt || null,
    },
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  }));

  // 5️⃣ Merge and sort all claimed records
  const allClaims = [...formattedMatched, ...formattedStandalone].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return allClaims;
};

const getAllMatchedAndPendingItems = async () => {
  const matchedAndPending = await MatchedItem.find({
    status: { $in: ["matched", "unclaimed"] },
  })
    .populate("lostItem")
    .populate("foundItem");

  const items = [];

  matchedAndPending.forEach((record) => {
    const status = record.status; // "matched" or "pending"

    if (record.lostItem) {
      items.push({
        ...record.lostItem.toObject(),
        status,
        type: "lost",
        matchedWith: record.foundItem
          ? {
              _id: record.foundItem._id,
              firstName: record.foundItem.firstName,
              lastName: record.foundItem.lastName,
              email: record.foundItem.email,
              contactNumber: record.foundItem.contactNumber,
              createdAt: record.foundItem.createdAt,
              category: record.foundItem.category,
              itemColor: record.foundItem.itemColor,
              itemSize: record.foundItem.itemSize,
              brandType: record.foundItem.brandType,
              uniqueIdentifier: record.foundItem.uniqueIdentifier,
              imageUrl: record.foundItem.imageUrl,
              moneyAmount: record.foundItem.moneyAmount,
              status: "matched",
              type: "found",
            }
          : null,
      });
    }

    if (record.foundItem) {
      items.push({
        ...record.foundItem.toObject(),
        status,
        type: "found",
        matchedWith: record.lostItem
          ? {
              _id: record.lostItem._id,
              firstName: record.lostItem.firstName,
              lastName: record.lostItem.lastName,
              email: record.lostItem.email,
              contactNumber: record.lostItem.contactNumber,
              createdAt: record.lostItem.createdAt,
              category: record.lostItem.category,
              itemColor: record.lostItem.itemColor,
              itemSize: record.lostItem.itemSize,
              brandType: record.lostItem.brandType,
              uniqueIdentifier: record.lostItem.uniqueIdentifier,
              imageUrl: record.lostItem.imageUrl,
              moneyAmount: record.lostItem.moneyAmount,
              status: "matched",
              type: "lost",
            }
          : null,
      });
    }
  });

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};


module.exports = {
  createOrUpdateMatch,
  claimMatchedItem,
  getMatchedItems,
  getPendingItems,
  getAllClaimedItem,
  getAllMatchedAndPendingItems,
};
