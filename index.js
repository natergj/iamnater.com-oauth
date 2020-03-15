const dist = require("./dist/index");
exports.handler = dist.handler;

process.on('uncaughtException', (e) => console.error(e));
process.on('unhandledRejection', (reason) => {
  throw new Error(reason);
});
