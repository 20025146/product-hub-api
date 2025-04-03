const express = require('express');
const productRouter = express.Router();
const audit = require('../middleware/audit.js');
const ProductsController = require('../controllers/products_controller.js');
const check_auth = require('../middleware/check-auth.js');

const API = {
  GET_ALL_PRODUCTS: '/',
  GET_INDIVIDUAL_PRODUCT: '/:productId',
  DELETE_PRODUCT: '/delete/:productId',
  UPDATE_PRODUCT: '/update/:productId',
  ADD_PRODUCT: '/',
};

productRouter.get(
  API.GET_ALL_PRODUCTS,
  audit,
  check_auth,
  ProductsController.getAllProducts
);
productRouter.get(
  API.GET_INDIVIDUAL_PRODUCT,
  audit,
  check_auth,
  ProductsController.getProduct
);
productRouter.post(
  API.ADD_PRODUCT,
  audit,
  check_auth,
  ProductsController.addProduct
);
productRouter.delete(
  API.DELETE_PRODUCT,
  audit,
  check_auth,
  ProductsController.deleteProduct
);
productRouter.put(
  API.UPDATE_PRODUCT,
  audit,
  check_auth,
  ProductsController.updateProduct
);

module.exports = productRouter;
