const express = require("express");
const router = express.Router();
const { ROLES } = require("../utils/roles");
const ItemController = require("../controllers/item.controller");
const MatchedItemController = require("../controllers/matchedItem.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");

// -------------------- ITEM ROUTES -------------------- //

// POST : Create new lost/found items
router.post("/lost", AuthMiddleware.authorize, ItemController.createLostItem);
router.post("/found", AuthMiddleware.authorize, ItemController.createFoundItem);

// GET : Lost & Found items (for logged-in users)
router.get("/lost", AuthMiddleware.authorize, ItemController.getLostItems);
router.get("/found", AuthMiddleware.authorize, ItemController.getFoundItems);

// GET : Items by category
router.get(
  "/lost/category/:category",
  AuthMiddleware.authorize,
  ItemController.getLostItemsByCategory
);
router.get(
  "/found/category/:category",
  AuthMiddleware.authorize,
  ItemController.getFoundItemsByCategory
);

// -------------------- MATCHED ITEM ROUTES -------------------- //

// GET : All matched items (admin only)
router.get(
  "/matched",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.getMatchedItems
);

// // GET : Single matched item (admin only)
// router.get(
//   "/matched/:matchedItemId",
//   AuthMiddleware.authorize,
//   AuthMiddleware.hasRole(ROLES.ADMIN),
//   MatchedItemController.getMatchedItemById
// );

// POST : Claim a matched item (user can claim their own, admin override allowed)
router.post(
  "/matched/:matchedItemId/claim",
  AuthMiddleware.authorize,
  AuthMiddleware.hasRole(ROLES.ADMIN),
  MatchedItemController.claimMatchedItem
);

// GET : All lost/found items (admin only)
router.get(
  "/",
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
