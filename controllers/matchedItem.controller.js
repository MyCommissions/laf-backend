const MatchedItemService = require("../services/matchedItem.service");
const Validation = require('../validations/itemSchema');

const getMatchedItems = async (req, res) => {
  try {
    const items = await MatchedItemService.getMatchedItems();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const claimMatchedItem = async (req, res) => {
  try {
    const { matchedItemId } = req.params;
    const result = await Validation.claimLostItemSchema.safeParse(req.body);
    const item = await MatchedItemService.claimMatchedItem(
      req.user,
      matchedItemId,
      result.data.pin.code
    );
    return res.status(200).json({
      status: "success",
      message: "Item claimed successfully!",
      item,
    });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: error.message });
  }
};

const getAllClaimedItem = async (req, res) => {
  try {
    const items = await MatchedItemService.getAllClaimedItem();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getMatchedItems,
  claimMatchedItem,
  getAllClaimedItem,
};
