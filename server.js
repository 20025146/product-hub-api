const dotenv = require('dotenv').config();
if (dotenv.error) {
  //Just in case there is no .env file throw exception
  throw 'Error: Unable to load .env file';
}
const http = require('http');
const cluster = require('cluster');
const app = require('./app');
const config = require('./src/config/config');
const numCPUs = require('os').cpus().length;
const numClusters = (numCPUs * 1.4).toFixed(); //e.g 24 Cores will run 33

const port = config.server.port;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is setting up ${numClusters} workers...`);
  // Fork workers.
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }
  cluster.on('online', function (worker) {
    // console.log(`Worker ${worker.process.pid} is online.`);
  });
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork(); // Create a New Worker, If Worker is Dead
  });
} else {
  const server = http.createServer(app);

  server.listen(port, () => {
    if (cluster.worker.id == 1) {
      //Print Only 1 Time
      console.log(
        `Listening on port http://${server.address().address}:${
          server.address().port
        } At ${new Date().toString()} On ${
          config.server.nodeEnv
        } Server as Worker ${cluster.worker.id} running @ process ${
          cluster.worker.process.pid
        }`,
      );
    }
  });
}
