const Item = require("../models/item");
const MatchedItemService = require("../services/matchedItem.service");
const { capitalizeFirst } = require("../utils/usecases");
const { CATEGORIES } = require("../utils/constants");
const { sendEmail } = require("../services/email.service");

// Validate category-specific fields
const categoryMatch = async (data) => {
  switch (data.category) {
    case "Umbrella":
      if (!data.itemSize) throw new Error("Item Size is required for Umbrella");
      if (!data.itemColor)
        throw new Error("Item Color is required for Umbrella");
      else {
        // Restrict adding other fields
        if (
          data.moneyAmount ||
          data.brandType ||
          data.uniqueIdentifier ||
          data.remarks
        )
          throw new Error(
            "Only Item Size and Item Color are allowed for Umbrella"
          );
      }
      break;

    case "Wallet":
      if (!data.moneyAmount || data.moneyAmount < 0)
        throw new Error("Money Amount is required for Wallet");
      if (!data.itemSize) throw new Error("Item Size is required for Wallet");
      if (!data.itemColor) throw new Error("Item Color is required for Wallet");
      if (!data.brandType) throw new Error("Brand Type is required for Wallet");
      else {
        if (data.uniqueIdentifier || data.remarks)
          throw new Error(
            "Only Money Amount, Item Size, Item Color, and Brand Type are allowed for Wallet"
          );
      }
      break;

    case "Phone":
      if (!data.brandType) throw new Error("Brand Type is required for Phone");
      if (!data.uniqueIdentifier)
        throw new Error(
          "Unique Identifier (IMEI/serial) is required for Phone"
        );
      else {
        if (data.itemSize || data.itemColor || data.moneyAmount || data.remarks)
          throw new Error(
            "Only Brand Type and Unique Identifier are allowed for Phone"
          );
      }
      break;

    case "Keys":
      if (!data.uniqueIdentifier)
        throw new Error(
          "Unique Identifier (key type/description) is required for Keys"
        );
      else {
        if (
          data.itemSize ||
          data.itemColor ||
          data.moneyAmount ||
          data.brandType ||
          data.remarks
        )
          throw new Error("Only Unique Identifier is allowed for Keys");
      }
      break;

    case "ID":
      if (!data.uniqueIdentifier)
        throw new Error("Unique Identifier (ID number) is required for ID");
      else {
        if (
          data.itemSize ||
          data.itemColor ||
          data.moneyAmount ||
          data.brandType ||
          data.remarks
        )
          throw new Error("Only Unique Identifier is allowed for ID");
      }
      break;

    case "Cash":
      if (!data.moneyAmount || data.moneyAmount <= 0)
        throw new Error("Money Amount is required for Cash");
      else {
        if (
          data.itemSize ||
          data.itemColor ||
          data.brandType ||
          data.uniqueIdentifier ||
          data.remarks
        )
          throw new Error("Only Money Amount is allowed for Cash");
      }
      break;

    case "Others":
      if (!data.remarks)
        throw new Error("Remarks/Description is required for Others");
      // No restrictions for others category
      break;

    default:
      throw new Error(`Unknown category: ${data.category}`);
  }
};

const createLostItem = async (data, currentUser) => {
  const {
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    imageKey, // Receive UUID key instead of file
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
  } = data;

  if (
    !firstName ||
    !lastName ||
    !contactNumber ||
    !email ||
    !category
  ) {
    throw new Error("Name, Category, Place Lost and Found At are required!");
  }

  await categoryMatch(data);

  if (!currentUser) throw new Error("Please login to post a lost item");

  const newItem = await Item.create({
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    imageUrl: imageKey, // Store UUID directly
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
    found: false,
    claimed: false,
    matched: false,
  });

  await MatchedItemService.createOrUpdateMatch(newItem);

  await sendEmail(
    email,
    "Lost Item Posted",
    `Hi ${firstName}, your lost item (${category}) has been posted successfully.`
  );

  return { newItem };
};

const createFoundItem = async (data, currentUser) => {
  const {
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    imageKey, // Receive UUID key instead of file
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
  } = data;

  if (
    !firstName ||
    !lastName ||
    !contactNumber ||
    !email ||
    !category
  ) {
    throw new Error("Name, Category, Place Found and Found At are required!");
  }

  await categoryMatch(data);

  if (!currentUser) throw new Error("Please login to post a found item");

  const newItem = await Item.create({
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    imageUrl: imageKey, // Store UUID directly
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
    found: true,
    claimed: false,
    matched: false,
  });

  await MatchedItemService.createOrUpdateMatch(newItem);

  await sendEmail(
    email,
    "Found Item Posted",
    `Hi ${firstName}, your found item (${category}) has been posted successfully.`
  );

  return { newItem };
};

const getAllItems = async (currentUser) => {
  if (!currentUser) throw new Error("Please login to get lost/found items");
  return await Item.find()
    .where({ claimed: false, matched: false })
    .sort({ createdAt: -1 });
};

const getLostItems = async (currentUser) => {
  if (!currentUser) throw new Error("Please login to get lost items");
  return await Item.find()
    .where({ found: false, claimed: false, matched: false })
    .sort({ createdAt: -1 });
};

const getLostItemsByCategory = async (currentUser, category) => {
  if (!currentUser)
    throw new Error("Please login to get lost items by category");
  const formattedCategory = capitalizeFirst(category);
  if (!CATEGORIES.includes(formattedCategory))
    throw new Error("Invalid category");
  return await Item.find({
    category: formattedCategory,
    found: false,
    claimed: false,
    matched: false,
  }).sort({ createdAt: -1 });
};

const getFoundItems = async (currentUser) => {
  if (!currentUser) throw new Error("Please login to get found items");
  return await Item.find()
    .where({ found: true, claimed: false })
    .sort({ createdAt: -1 });
};

const getFoundItemsByCategory = async (currentUser, category) => {
  if (!currentUser)
    throw new Error("Please login to get found items by category");
  const formattedCategory = capitalizeFirst(category);
  if (!CATEGORIES.includes(formattedCategory))
    throw new Error("Invalid category");
  return await Item.find({
    category: formattedCategory,
    found: true,
    claimed: false,
    matched: false,
  }).sort({ createdAt: -1 });
};

const updatePendingItem = async (id, data, currentUser) => {
  if (!currentUser) throw new Error("Please login to update a pending item");

  const item = await Item.findOne({ _id: id, matched: false, claimed: false });
  if (!item)
    throw new Error("Pending item not found or already matched/claimed");

  await categoryMatch(data);

  const {
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
  } = data;

  // 3️⃣ Update DB record
  const updatedItem = await Item.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      contactNumber,
      email,
      category,
      moneyAmount,
      itemSize,
      itemColor,
      brandType,
      uniqueIdentifier,
      remarks,
    },
    { new: true }
  );

  return updatedItem;
};

const deletePendingItem = async (id, currentUser) => {
  if (!currentUser) throw new Error("Please login to delete an item");

  const item = await Item.findOne({ _id: id, matched: false });
  if (!item) throw new Error("Item not found or already matched");

  // Delete image from Cloudflare R2 (if it exists)
  if (item.imageUrl) {
    try {
      await deleteFromR2(item.imageUrl);
    } catch (err) {
      console.warn("Failed to delete image from R2:", err.message);
    }
  }

  await Item.findByIdAndDelete(id);
  return item;
};

module.exports = {
  createLostItem,
  createFoundItem,
  getAllItems,
  getLostItems,
  getFoundItems,
  getLostItemsByCategory,
  getFoundItemsByCategory,
  updatePendingItem,
  deletePendingItem,
};
