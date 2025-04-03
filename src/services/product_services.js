const models = require('../models/index');

class ProductServices {
  async createProduct(product) {
    return await models.Products({ ...product }).save();
  }

  async getAllProducts(query, page, limit) {
    return await models.Products.find({ ...query })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  }

  async getProductByID(productId) {
    return await models.Products.findOne({
      _id: productId,
      isDeleted: false,
    }).lean();
  }

  async deleteProduct(productId) {
    return await models.Products.findByIdAndDelete(productId);
  }

  async updateProduct(productId, updateData) {
    return await models.Products.findByIdAndUpdate(
      productId,
      { ...updateData },
      { new: true }
    );
  }
}

module.exports = new ProductServices();
