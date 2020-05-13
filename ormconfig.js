const path = require('path');
const rootDir = path.join(__dirname, 'src');
const rootDirJson = rootDir.replace(/\\/gi, '\\\\');

let defaultConfig = require("./src/config/typeorm/default.config.json");


defaultConfig = JSON.stringify(defaultConfig);
defaultConfig = defaultConfig.replace(/\$\{rootDir\}/g, 'src');
defaultConfig = JSON.parse(defaultConfig);

console.log(defaultConfig);
//console.log(newConn);
module.exports = defaultConfig;