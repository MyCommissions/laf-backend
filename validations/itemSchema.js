const { z } = require("zod");
const { CATEGORIES } = require("../utils/constants");
const { sixDigits } = require("../utils/regex");

const createItemSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(1, "First name cannot be empty"),

  lastName: z
    .string({ required_error: "Last name is required" })
    .min(1, "Last name cannot be empty"),

  contactNumber: z
    .string({ required_error: "Contact number is required" })
    .min(7, "Contact number is too short"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),

  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Invalid category" }),
  }),

  imageUrl: z.string().url("Image must be a valid URL").optional(),

  moneyAmount: z.coerce.number().min(0).optional().default(0),

  itemSize: z.enum(["Small", "Medium", "Large"]).optional(),

  itemColor: z
    .enum([
      "Red",
      "Orange",
      "Yellow",
      "Green",
      "Blue",
      "Indigo",
      "Violet",
      "Black",
      "White",
    ])
    .optional(),

  brandType: z.string().optional(),

  uniqueIdentifier: z.string().optional(),

  remarks: z.string().optional(),

  found: z.coerce.boolean().optional().default(false),

  claimed: z.coerce.boolean().optional().default(false),

  placeLost: z.string().optional().default(""),
  placeFound: z.string().optional().default(""),
  foundAt: z.string().datetime("Invalid date format").optional(),
});

const claimLostItemSchema = z.object({
  pin: z.object({
    code: z
      .string({ required_error: "Pin number is required" })
      .regex(sixDigits, "Pin must be exactly 6 digits"),
  }),
  claimInfo: z.object({
    imageUuid: z
      .string({ required_error: "Image UUID is required" })
      .min(1, "Image UUID cannot be empty")
      .optional(),
    contactNumber: z
      .string({ required_error: "Contact number is required" })
      .min(7, "Contact number is too short"),
    firstName: z
      .string({ required_error: "First name is required" })
      .min(1, "First name cannot be empty"),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(1, "Last name cannot be empty"),
    timeOfClaim: z.string().datetime().optional(), // frontend may send ISO timestamp
  }),
});

module.exports = {
  createItemSchema,
  claimLostItemSchema,
};
