const MatchedItemService = require("../services/matchedItem.service");
const Validation = require('../validations/itemSchema');
const { ZodError } = require("zod");
const uploadService = require("../services/upload.service");

const getMatchedItems = async (req, res) => {
  try {
    const items = await MatchedItemService.getMatchedItems();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getPendingItems = async (req, res) => {
  try {
    const items = await MatchedItemService.getPendingItems();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const claimMatchedItem = async (req, res) => {
  try {
    const { matchedItemId } = req.params;

    // 🧩 Validate body
    const result = Validation.claimLostItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        status: "fail",
        message: result.error.errors[0].message,
      });
    }

    const { pin, claimInfo } = result.data;

    // 🟢 Upload image to Cloudflare R2 (if present)
    let imageKey = null;
    if (req.file) {
      imageKey = await uploadService.uploadToR2(req.file);
    }

    // ✅ Merge Cloudflare UUID into claim info
    const finalClaimInfo = {
      ...claimInfo,
      imageUuid: imageKey,
    };

    // 🧩 Proceed to service
    const item = await MatchedItemService.claimMatchedItem(
      req.user,
      matchedItemId,
      pin.code,
      finalClaimInfo
    );

    return res.status(200).json({
      status: "success",
      message: "Item claimed successfully!",
      item,
    });
  } catch (error) {
    console.error("Claim error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "fail",
        message: error.errors.map((e) => e.message),
      });
    }

    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
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

const getAllMatchedAndPendingItems = async (req, res) => {
  try {
    const items = await MatchedItemService.getAllMatchedAndPendingItems();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getMatchedItems,
  getPendingItems,
  claimMatchedItem,
  getAllClaimedItem,
  getAllMatchedAndPendingItems,
};
