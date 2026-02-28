import { check, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
};

export const registerValidator = [
  check("firstName", "First Name is required").not().isEmpty().trim(),
  check("lastName", "Last Name is required").not().isEmpty().trim(),
  check("email", "Please include a valid email").isEmail().normalizeEmail(),
  check("contactNumber", "Contact number is required").not().isEmpty(),
  check("password", "Password must be at least 6 characters long").isLength({
    min: 6,
  }),
];

export const loginValidator = [
  check("email", "Please include a valid email").isEmail().normalizeEmail(),
  check("password", "Password is required").exists(),
];

// For creating NEW products (Everything is required)
export const productValidator = [
  check("name", "Product name is required").not().isEmpty().trim(),
  check("price", "Price must be a positive number").isFloat({ min: 0 }),
  check("countInStock", "Stock must be a positive integer").isInt({ min: 0 }),
  check("category", "Category must be 'bakery' or 'cake'").isIn([
    "bakery",
    "cake",
  ]),
];

// 👇 ADD THIS: For UPDATING products (Fields are optional, allowing Restock to work)
export const productUpdateValidator = [
  check("name", "Product name cannot be empty")
    .optional()
    .not()
    .isEmpty()
    .trim(),
  check("price", "Price must be a positive number")
    .optional()
    .isFloat({ min: 0 }),
  check("countInStock", "Stock must be a positive integer")
    .optional()
    .isInt({ min: 0 }),
  check("category", "Category must be 'bakery' or 'cake'")
    .optional()
    .isIn(["bakery", "cake"]),
];
