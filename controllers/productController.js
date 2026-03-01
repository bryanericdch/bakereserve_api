import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isDeleted: false }).sort({
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

  // Parse the dynamic sizes array from frontend
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

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price !== undefined ? price : product.price;
    product.description = description || product.description;
    product.category = category || product.category;
    product.countInStock =
      countInStock !== undefined ? countInStock : product.countInStock;
    product.flavor = flavor || product.flavor;
    product.subCategory = subCategory || product.subCategory;
    product.piecesPerPack = piecesPerPack || product.piecesPerPack;

    // Update sizes
    if (req.body.sizes) product.sizes = sizes;
    if (req.file) product.image = req.file.path;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    product.isDeleted = true;
    await product.save();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});
