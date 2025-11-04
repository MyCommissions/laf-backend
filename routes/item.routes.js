const express = require("express");
const router = express.Router();
const { ROLES } = require("../utils/roles");
const upload = require("../middlewares/upload");
const ItemController = require("../controllers/item.controller");
const MatchedItemController = require("../controllers/matchedItem.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");

// -------------------- ITEM ROUTES -------------------- //

// GET : All Items (for logged-in users, with signed image URLs)
router.get("/", AuthMiddleware.authorize, ItemController.getAllItems);

// POST : Create new lost item (with optional image upload)
router.post(
  "/lost",
  AuthMiddleware.authorize,
  upload.single("image"), // handle file upload
  ItemController.createLostItem
);

// POST : Create new found item (with optional image upload)
router.post(
  "/found",
  AuthMiddleware.authorize,
  upload.single("image"),
  ItemController.createFoundItem
);

router.put(
  "/pending/:id",
  AuthMiddleware.authorize,
  upload.single("image"), // same as create
  ItemController.updatePendingItem
);

router.delete(
  "/pending/:id",
  AuthMiddleware.authorize,
  ItemController.deletePendingItem
);

// GET : Lost & Found items (with signed image URLs)
router.get("/lost", AuthMiddleware.authorize, ItemController.getLostItems);
router.get("/found", AuthMiddleware.authorize, ItemController.getFoundItems);

// GET : Lost & Found items by category
router.get(
  "/lost/:category",
  AuthMiddleware.authorize,
  ItemController.getLostItemsByCategory
);
router.get(
  "/found/:category",
  AuthMiddleware.authorize,
  ItemController.getFoundItemsByCategory
);

// -------------------- MATCHED ITEM ROUTES -------------------- //

// GET : All matched items (admin only, with signed image URLs if needed)
router.get(
  "/matched",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.getMatchedItems
);

// GET : All pending items (admin only)
router.get(
  "/pending",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.getPendingItems
);

router.get(
  "/all",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.getAllMatchedAndPendingItems
);

// POST : Claim a matched item (admin only)
router.post(
  "/matched/:matchedItemId/claim",
  AuthMiddleware.authorize,
  upload.single("imageUuid"),
  MatchedItemController.claimMatchedItem
);

// GET : All items (admin only)
router.get(
  "/admin",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  ItemController.getAllItems
);

// GET : Claimed items (admin only)
router.get(
  "/claimed",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.getAllClaimedItem
);

module.exports = router;
