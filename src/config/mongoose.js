const mongoose = require('mongoose');
const config = require('./config');
const cluster = require('cluster');

class MongoConnection {
  constructor() {
    if (!MongoConnection.instance) {
      const {
        server: { mongoHost, mongoPort, db, poolSize },
      } = config;

      this.mongo_url = `mongodb://${mongoHost}:${mongoPort}/${db}?maxPoolSize=${poolSize}`;
      MongoConnection.instance = this;
    }

    return MongoConnection.instance;
  }

  connect() {
    mongoose.set('strictQuery', true);
    mongoose
      .connect(this.mongo_url)
      .then(() => {
        if (cluster.isMaster) console.log('Successfully connected to MongoDB');
      })
      .catch((error) => {
        console.log('MongoDB connection failed. Exiting now...');
        console.error(error);
        process.exit(1);
      });
  }
}

const mongoConnectionInstance = new MongoConnection();
module.exports = mongoConnectionInstance;
