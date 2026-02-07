import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";

// @desc Create product (Admin)
// @route POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Product image is required");
  }

  const product = await Product.create({
    ...req.body,
    image: req.file.path,
    user: req.user._id,
    isDeleted: false, // Ensure new products are visible
  });

  res.status(201).json(product);
});

// @desc Get all products (Public)
// @route GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  // Fix: Only fetch products that are NOT deleted
  // { $ne: true } ensures compatibility with old items that don't have the field yet
  const products = await Product.find({ isDeleted: { $ne: true } });
  res.json(products);
});

// @desc Get single product
// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // Optional: Prevent viewing if deleted, or allow for Order History
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc Update product (Admin)
// @route PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { name, price, description, category, subCategory, countInStock } =
    req.body;

  product.name = name || product.name;
  product.price = price || product.price;
  product.description = description || product.description;
  product.countInStock = countInStock || product.countInStock;
  product.category = category || product.category;

  // Clear subCategory if switching to bakery
  if (product.category === "bakery") {
    product.subCategory = undefined;
  } else if (subCategory) {
    product.subCategory = subCategory;
  }

  if (req.file) {
    product.image = req.file.path;
  }

  // Ensure updating brings it back if it was deleted
  product.isDeleted = false;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// @desc Delete product (Admin)
// @route DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // --- SOFT DELETE LOGIC ---
  product.isDeleted = true;
  await product.save();

  res.json({ message: "Product hidden" });
});
