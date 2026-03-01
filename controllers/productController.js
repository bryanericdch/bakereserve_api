import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isDeleted: { $ne: true } }).sort({
    createdAt: -1,
  });
  res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product && !product.isDeleted) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    category,
    countInStock,
    flavor,
    subCategory,
    piecesPerPack,
  } = req.body;
  const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];

  const product = new Product({
    user: req.user._id,
    name,
    price,
    description,
    category,
    countInStock,
    flavor,
    subCategory,
    piecesPerPack,
    sizes,
    image: req.file ? req.file.path : "https://via.placeholder.com/300",
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const {
    name,
    price,
    description,
    category,
    countInStock,
    flavor,
    subCategory,
    piecesPerPack,
  } = req.body;
  const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : product.sizes;

  const updateData = {
    name: name || product.name,
    price: price !== undefined ? price : product.price,
    description: description || product.description,
    category: category || product.category,
    countInStock:
      countInStock !== undefined ? countInStock : product.countInStock,
    flavor: flavor || product.flavor,
    subCategory: subCategory || product.subCategory,
    piecesPerPack: piecesPerPack || product.piecesPerPack,
    sizes: sizes,
  };

  if (req.file) updateData.image = req.file.path;

  // FIX: Bypasses strict schema validation on old products when restocking
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: false },
  );
  res.json(updatedProduct);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  // FIX: Bypasses strict schema validation so the trash button always works
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true, runValidators: false },
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ message: "Product hidden" });
});
