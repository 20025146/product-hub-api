const JWT = require('../helpers/jwt/jwtHelper');
const ProductServices = require('../services/product_services');
const mongoose = require('mongoose');
const { wrapAsync } = require('../utils/wrapAsync');

const getAllProducts = async (req, res) => {
  const { page = 1, limit = 10, searchTerm, category } = req.body;

  let query = { isDeleted: false };
  if (category) {
    query.category = category;
  }
  if (searchTerm) {
    query = {
      ...query,
      $or: [{ service_name: { $regex: searchTerm, $options: 'i' } }],
    };
  }
  const products = await ProductServices.getAllProducts(query, page, limit);

  return res.json({
    data: products,
    currentPage: page,
    nextPage: products.length < limit ? null : page + 1,
    message: 'Products found successfully',
  });
};
const createProduct = async (req, res) => {
  const { ...rest } = req.body;

  // Save all products to the database
  const response = await ProductServices.createProduct(rest);

  res.status(200).json({
    products: response,
  });
};

const getProduct = async (req, res) => {
  const { productID } = req.params;
  const objectId = new mongoose.Types.ObjectId(productID);

  const products = await ProductServices.getProductByID(objectId);

  return res.json({
    data: products,
    message: 'Product retrieved successfully',
  });
};
const deleteProduct = async (req, res) => {
  const { productID } = req.params;
  const products = await ProductServices.deleteProduct(productID);

  return res.json({
    data: products,
    message: 'Product deleted successfully',
  });
};
const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const updatedProductData = req.body;
  const updatedProduct = await ProductServices.updateProduct(
    productId,
    updatedProductData
  );

  return res.json({
    data: updatedProduct,
    message: 'Product updated successfully',
  });
};

const ProductController = {
  getAllProducts: wrapAsync(getAllProducts),
  addProduct: wrapAsync(createProduct),
  getProduct: wrapAsync(getProduct),
  deleteProduct: wrapAsync(deleteProduct),
  updateProduct: wrapAsync(updateProduct),
};

module.exports = ProductController;
