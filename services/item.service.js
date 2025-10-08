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
      break;

    case "Wallet":
      if (!data.moneyAmount || data.moneyAmount < 0)
        throw new Error("Money Amount is required for Wallet");
      if (!data.itemSize) throw new Error("Item Size is required for Wallet");
      if (!data.itemColor) throw new Error("Item Color is required for Wallet");
      if (!data.brandType) throw new Error("Brand Type is required for Wallet");
      break;

    case "Phone":
      if (!data.brandType) throw new Error("Brand Type is required for Phone");
      if (!data.uniqueIdentifier)
        throw new Error(
          "Unique Identifier (IMEI/serial) is required for Phone"
        );
      break;

    case "Keys":
      if (!data.uniqueIdentifier)
        throw new Error(
          "Unique Identifier (key type/description) is required for Keys"
        );
      break;

    case "ID":
      if (!data.uniqueIdentifier)
        throw new Error("Unique Identifier is required for ID (ID number)");
      break;

    case "Cash":
      if (!data.moneyAmount || data.moneyAmount <= 0)
        throw new Error("Money Amount is required for Cash");
      break;

    case "Others":
      if (!data.remarks)
        throw new Error("Remarks/Description is required for Others");
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
    .where({ found: true, claimed: false, matched: false })
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

module.exports = {
  createLostItem,
  createFoundItem,
  getAllItems,
  getLostItems,
  getFoundItems,
  getLostItemsByCategory,
  getFoundItemsByCategory,
};
