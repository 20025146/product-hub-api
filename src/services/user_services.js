const models = require('../models/index');

class UserService {
  async createUser(postData) {
    return await models.Users({ ...postData }).save();
  }

  async getUserByEmail(email) {
    return await models.Users.findOne({ email });
  }

  async getAllUsers(query, page, limit) {
    return await models.Users.find({ ...query })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  }

  async getNumberOfUsers(pipeline) {
    return await models.Users.aggregate(pipeline);
  }

  async getUser(filter) {
    return await models.Users.findOne({ ...filter });
  }

  async updateUserByID(id, updateData) {
    return await models.Users.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true }
    );
  }

  async updateUserByEmail(email, updateData) {
    return await models.Users.findOneAndUpdate(
      { email },
      { ...updateData },
      { new: true }
    );
  }

  async getUserByID(userID) {
    return await models.Users.findOne({ _id: userID, isDeleted: false }).lean();
  }
  async deleteUserByID(userID) {
    return await models.Users.findOneAndRemove({ _id: userID });
  }
  async dropUserCollection() {
    await models.Users.db.syncIndexes();
    await models.Users.collection.drop();
  }
}

module.exports = new UserService();
