const { ZodError } = require('zod');
const ItemService = require('../services/item.service');
const Validation = require('../validations/itemSchema');

const createLostItem = async (req, res) => {
    try {
        const result = Validation.createItemSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                status: "fail",
                message: result.error.errors[0].message
            })
        }

        const item = await ItemService.createLostItem(result.data, req.user);

        return res.status(200).json({
            status: "success",
            message: "Item created successfully!",
            item: item
        })
    } catch (error) {
        console.log(error);

        const knownErrors = {
          "Name, Category, Place Lost and Found At are required!": 400,
          "Please login to post a lost item": 401,
        };

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
    }
}

const createFoundItem = async (req, res) => {
  try {
    const result = Validation.createItemSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    const item = await ItemService.createFoundItem(result.data, req.user);

    return res.status(200).json({
      status: "success",
      message: "Item created successfully!",
      item: item,
    });
  } catch (error) {
    console.log(error);

    const knownErrors = {
      "Name, Category, Place Found and Found At are required!": 400,
      "Please login to post a found item": 401,
    };

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
  }
};

const getAllItems = async (req, res) => {
    try {
        const items = await ItemService.getAllItems(req.user);

        return res.status(200).json(items);
    } catch (error) {
        console.log(error);

        const knownErrors = {
            "Please login to get lost/found items": 401,
        }

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
    }
}

const getLostItems = async (req, res) => {
  try {
    const items = await ItemService.getLostItems(req.user);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);

    const knownErrors = {
      "Please login to get lost items": 401,
    };

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
  }
};

const getFoundItems = async (req, res) => {
  try {
    const items = await ItemService.getFoundItems(req.user);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);

    const knownErrors = {
      "Please login to get found items": 401,
    };

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
  }
};

const getLostItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ItemService.getLostItemsByCategory(req.user, category);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);

    const knownErrors = {
      "Please login to get lost umbrella items": 401,
      "Invalid category": 400,
    };

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
  }
};

const getFoundItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ItemService.getFoundItemsByCategory(req.user, category);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);

    const knownErrors = {
      [`Please login to get lost ${category} items`]: 401,
      "Invalid category": 400,
    };

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
};