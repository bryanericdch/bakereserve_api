import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
// import { cloudinary } from "../config/cloudinary.js"; // Not strictly needed if using req.file.path

// @desc Create product (Admin)
// @route POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Product image is required");
  }

  const product = await Product.create({
    ...req.body,
    image: req.file.path, // Cloudinary URL from Multer
    user: req.user._id,   // Fix: Matches 'user' field in Model
  });

  res.status(201).json(product);
});

// @desc Get all products (Public)
// @route GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  // Fix: Removed { isAvailable: true } because the field doesn't exist in Schema
  const products = await Product.find({}); 
  res.json(products);
});

// @desc Get single product
// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
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

  // Manual update to handle logic safely
  const { name, price, description, category, subCategory, countInStock } = req.body;

  product.name = name || product.name;
  product.price = price || product.price;
  product.description = description || product.description;
  product.countInStock = countInStock || product.countInStock;
  product.category = category || product.category;

  // Logic: If category is Bakery, clear the Cake Type
  if (product.category === 'bakery') {
      product.subCategory = undefined; 
  } else if (subCategory) {
      product.subCategory = subCategory;
  }

  // Update image only if a new file is uploaded
  if (req.file) {
    product.image = req.file.path;
  }

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

  await product.deleteOne();
  res.json({ message: "Product removed" });
});