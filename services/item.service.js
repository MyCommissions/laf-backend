const Item = require('../models/item');
const MatchedItemService = require('../services/matchedItem.service');
const { capitalizeFirst } = require('../utils/usecases');
const { CATEGORIES } = require('../utils/constants')

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

  return await Item.find().where({ found: false }).sort({ createdAt: -1 });
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
    .where({ category: formattedCategory, found: false })
    .sort({ createdAt: -1 });
};

const getFoundItems = async (currentUser) => {
  if (!currentUser) {
    throw new Error("Please login to get found items");
  }

  return await Item.find().where({ found: true }).sort({ createdAt: -1 });
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
    .where({ category: formattedCategory, found: true })
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