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
    isDeleted: false,
  });

  res.status(201).json(product);
});

// @desc Get all products (Public)
// @route GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  // FIX 1: Filter out deleted products
  const products = await Product.find({ isDeleted: { $ne: true } });
  res.json(products);
});

// @desc Get single product
// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product && !product.isDeleted) {
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

  // FIX 2: Manually update fields to prevent Enum errors
  product.name = name || product.name;
  product.price = price || product.price;
  product.description = description || product.description;
  product.countInStock = countInStock || product.countInStock;
  product.category = category || product.category;

  // Logic: Clear subCategory if switching to Bakery
  if (product.category === "bakery") {
    product.subCategory = undefined;
  } else if (
    subCategory &&
    subCategory !== "null" &&
    subCategory !== "undefined"
  ) {
    product.subCategory = subCategory;
  }

  // Update image only if a new file is uploaded
  if (req.file) {
    product.image = req.file.path;
  }

  // Ensure product is visible if it was somehow deleted
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

  // FIX 3: Soft Delete (Mark as deleted instead of removing)
  product.isDeleted = true;
  await product.save();

  res.json({ message: "Product hidden" });
});
