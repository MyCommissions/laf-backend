const { ZodError } = require("zod");
const ItemService = require("../services/item.service");
const Validation = require("../validations/itemSchema");
const uploadService = require("../services/upload.service");

// Helper for handling known and Zod errors
const handleError = (res, error, knownErrors = {}) => {
  console.error(error);

  if (knownErrors[error.message]) {
    return res.status(knownErrors[error.message]).json({
      status: "fail",
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      message: error.errors.map((e) => e.message),
    });
  }

  return res.status(500).json({
    status: "error",
    message: error.message,
  });
};

// -------------------- LOST ITEM --------------------
const createLostItem = async (req, res) => {
  try {
    const result = Validation.createItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    let imageKey = null;
    if (req.file) {
      imageKey = await uploadService.uploadToR2(req.file);
    }

    const item = await ItemService.createLostItem(
      { ...result.data, imageKey },
      req.user
    );

    return res.status(200).json({
      status: "success",
      message: "Lost item created successfully!",
      item,
    });
  } catch (error) {
    handleError(res, error, {
      "Name, Category, Place Lost and Found At are required!": 400,
      "Please login to post a lost item": 401,
    });
  }
};

// -------------------- FOUND ITEM --------------------
const createFoundItem = async (req, res) => {
  try {
    const result = Validation.createItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    let imageKey = null;
    if (req.file) {
      imageKey = await uploadService.uploadToR2(req.file);
    }

    const item = await ItemService.createFoundItem(
      { ...result.data, imageKey },
      req.user
    );

    return res.status(200).json({
      status: "success",
      message: "Found item created successfully!",
      item,
    });
  } catch (error) {
    handleError(res, error, {
      "Name, Category, Place Found and Found At are required!": 400,
      "Please login to post a found item": 401,
    });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await ItemService.getAllItems(req.user);
    return res.status(200).json(items);
  } catch (error) {
    handleError(res, error, {
      "Please login to get lost/found items": 401,
    });
  }
};

const getLostItems = async (req, res) => {
  try {
    const items = await ItemService.getLostItems(req.user);
    return res.status(200).json(items);
  } catch (error) {
    handleError(res, error, {
      "Please login to get lost items": 401,
    });
  }
};

const getFoundItems = async (req, res) => {
  try {
    const items = await ItemService.getFoundItems(req.user);
    return res.status(200).json(items);
  } catch (error) {
    handleError(res, error, {
      "Please login to get found items": 401,
    });
  }
};

const getLostItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ItemService.getLostItemsByCategory(req.user, category);
    return res.status(200).json(items);
  } catch (error) {
    handleError(res, error, {
      "Please login to get lost umbrella items": 401,
      "Invalid category": 400,
    });
  }
};

const getFoundItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ItemService.getFoundItemsByCategory(req.user, category);
    return res.status(200).json(items);
  } catch (error) {
    handleError(res, error, {
      "Please login to get found items by category": 401,
      "Invalid category": 400,
    });
  }
};

const updatePendingItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = Validation.updateItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    const updatedItem = await ItemService.updatePendingItem(
      id,
      result.data,
      req.user,
      req.file // pass file for image replacement
    );

    return res.status(200).json({
      status: "success",
      message: "Pending item updated successfully!",
      updatedItem,
    });
  } catch (error) {
    handleError(res, error, {
      "Please login to update a pending item": 401,
      "Pending item not found or already matched/claimed": 404,
    });
  }
};

const deletePendingItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await ItemService.deletePendingItem(id, req.user);

    return res.status(200).json({
      status: "success",
      message: "Item deleted successfully!",
      deletedItem,
    });
  } catch (error) {
    handleError(res, error, {
      "Please login to delete an item": 401,
      "Item not found or already matched": 404,
    });
  }
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
