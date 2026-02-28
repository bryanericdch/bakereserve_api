import { check, validationResult } from "express-validator";

// 1. Catcher Function: This checks if any of the rules below failed
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    // Throw the very first error message so our global error handler catches it
    throw new Error(errors.array()[0].msg);
  }
  next();
};

// 2. Rules for Authentication
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

// 3. Rules for Products (Ensures prices and stock are never negative)
export const productValidator = [
  check("name", "Product name is required").not().isEmpty().trim(),
  check("price", "Price must be a positive number").isFloat({ min: 0 }),
  check("countInStock", "Stock must be a positive integer").isInt({ min: 0 }),
  check("category", "Category must be 'bakery' or 'cake'").isIn([
    "bakery",
    "cake",
  ]),
];
