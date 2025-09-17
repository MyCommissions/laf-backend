const Item = require('../models/item');
const MatchedItemService = require('../services/matchedItem.service');
const { capitalizeFirst } = require('../utils/usecases');
const { CATEGORIES } = require('../utils/constants');

const categoryMatch = async (data) => {
  if (data.category === "Umbrella") {

  }

  if (data.category === "Wallet") {
    if (!data.moneyAmount || data.moneyAmount < 0) {
      throw new Error("Money Amount is required");
    }

    if (!data.itemSize) {
      throw new Error("Item Size is required");
    }

    if (!data.itemColor) {
      throw new Error("Item Color is required");
    }

    if (!data.brandType) {
      throw new Error("Brand Type is required");
    }
  }

  if (data.category === "Cash") {
    if (!data.moneyAmount || data.moneyAmount <= 0) {
      throw new Error("Money Amount is required");
    }
  }

  if (data.category === "Phone") {
    if (!data.itemColor) {
      throw new Error("Item Color is required");
    }

    if (!data.brandType) {
      throw new Error("Brand Type is required");
    }
  }

  if (data.category === "ID") {
    if (!data.brandType) {
      throw new Error("Brand Type is required");
    }

    if (!data.uniqueIdentifier) {
      throw new Error("Unique Identifier is required");
    }
  }
  
  if (data.category === "Others") {
  }
}

const createLostItem = async (data, currentUser) => {
  const {
    firstName,
    lastName,
    contactNumber,
    category,
    imageUrl,
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks
  } = data;

  if (!firstName || !lastName || !contactNumber || !category || !remarks) {
    throw new Error("Name, Category, Place Lost and Found At are required!");
  }

  await categoryMatch(data);

  if (!currentUser) {
    throw new Error("Please login to post a lost item");
  }

  const newItem = await Item.create({
    firstName,
    lastName,
    contactNumber,
    category,
    imageUrl,
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

  return { newItem };
};

const createFoundItem = async (data, currentUser) => {
  const {
    firstName,
    lastName,
    contactNumber,
    category,
    imageUrl,
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
  } = data;

  console.log(currentUser);

  if (!firstName || !lastName || !contactNumber || !category || !remarks) {
    throw new Error("Name, Category, Place Found and Found At are required!");
  }

  await categoryMatch(data);

  if (!currentUser) {
    throw new Error("Please login to post a found item");
  }

  const newItem = await Item.create({
    firstName,
    lastName,
    contactNumber,
    category,
    imageUrl,
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

  return { newItem };
};

const getAllItems = async (currentUser) => {
  if (!currentUser) {
    throw new Error("Please login to get lost/found items");
  }

  return await Item.find().sort({ createdAt: -1 });
};

const getLostItems = async (currentUser) => {
  if (!currentUser) {
    throw new Error("Please login to get lost items");
  }

  return await Item.find()
    .where({ found: false, claimed: false, matched: false })
    .sort({ createdAt: -1 });
};

const getLostItemsByCategory = async (currentUser, category) => {
  if (!currentUser) {
    throw new Error("Please login to get lost umbrella items");
  }

  const formattedCategory = capitalizeFirst(category);

  if (!CATEGORIES.includes(formattedCategory)) {
    throw new Error("Invalid category");
  }

  return await Item.find()
    .where({
      category: formattedCategory,
      found: false,
      claimed: false,
      matched: false,
    })
    .sort({ createdAt: -1 });
};

const getFoundItems = async (currentUser) => {
  if (!currentUser) {
    throw new Error("Please login to get found items");
  }

  return await Item.find()
    .where({ found: true, claimed: false, matched: false })
    .sort({ createdAt: -1 });
};

const getFoundItemsByCategory = async (currentUser, category) => {
  if (!currentUser) {
    throw new Error("Please login to get lost umbrella items");
  }

  const formattedCategory = capitalizeFirst(category);

  if (!CATEGORIES.includes(formattedCategory)) {
    throw new Error("Invalid category");
  }

  return await Item.find()
    .where({
      category: formattedCategory,
      found: true,
      claimed: false,
      matched: false,
    })
    .sort({ createdAt: -1 });
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