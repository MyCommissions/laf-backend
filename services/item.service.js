const Item = require('../models/item');
const MatchedItemService = require('../services/matchedItem.service');
const { capitalizeFirst } = require('../utils/usecases');
const { CATEGORIES } = require('../utils/constants');
const { sendEmail } = require('../services/email.service');

const createLostItem = async (data, currentUser) => {
  const {
    firstName,
    lastName,
    contactNumber,
    email,
    category,
    imageUrl,
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks
  } = data;

  if (!firstName || !lastName || !contactNumber || !email || !category || !remarks) {
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
    email,
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
    imageUrl,
    moneyAmount,
    itemSize,
    itemColor,
    brandType,
    uniqueIdentifier,
    remarks,
  } = data;

  console.log(currentUser);

  if (!firstName || !lastName || !contactNumber || !email || !category || !remarks) {
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
    email,
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

  await sendEmail(
    email,
    "Found Item Posted",
    `Hi ${firstName}, your found item (${category}) has been posted successfully.`
  );

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