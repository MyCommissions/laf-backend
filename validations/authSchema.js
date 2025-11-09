const { z } = require("zod");
const { ROLES } = require("../utils/roles");
const REGEX = require("../utils/regex");

const createAccountSchema = z.object({
    firstname: z
        .string({ required_error: "Firstname is required" })
        .min(1, "Firstname cannot be empty"),
    lastname: z
        .string({ required_error: "Lastname is required" })
        .min(1, "Lastname cannot be empty"),
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format"),
    roleId: z.union([z.literal(1), z.literal(2)], {
        errorMap: () => ({
        message: "Role ID must be either 1 (Admin) or 2 (Staff)",
        }),
    }),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long")
        .regex(REGEX.oneUpperCase, "Password must contain at least one uppercase letter")
        .regex(REGEX.oneNumber, "Password must contain at least one number"),
});

const signUpSchema = z.object({
    firstname: z
        .string({ required_error: "Firstname is required" })
        .min(1, "Firstname cannot be empty"),
    lastname: z
        .string({ required_error: "Lastname is required" })
        .min(1, "Lastname cannot be empty"),
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long")
        .regex(REGEX.oneUpperCase, "Password must contain at least one uppercase letter")
        .regex(REGEX.oneNumber, "Password must contain at least one number"),
});

const loginSchema = z.object({

    email: z
        .string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email format"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    rememberMe: z.boolean().optional().default(false),

})

const updateUserSchema = z.object({
  firstname: z.string().min(1, "Firstname cannot be empty").optional(),
  lastname: z.string().min(1, "Lastname cannot be empty").optional(),
  email: z.string().email("Invalid email format").optional(),
  roleId: z.union([z.literal(1), z.literal(2)], {
    errorMap: () => ({
      message: "Role ID must be either 1 (Admin) or 2 (Staff)",
    }),
  }),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(
      REGEX.oneUpperCase,
      "Password must contain at least one uppercase letter"
    )
    .regex(REGEX.oneNumber, "Password must contain at least one number")
    .optional(),
});


module.exports = {
  createAccountSchema,
  signUpSchema,
  loginSchema,
  updateUserSchema,
};