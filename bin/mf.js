import fs from "fs";

const action = process.argv[2];
const name = process.argv[3];

const config = JSON.parse(fs.readFileSync("mf.config.json"));

if (action === "add") {
  config.remotes[name] = `http://localhost:3002/assets/remoteEntry.js`;
  fs.writeFileSync("mf.config.json", JSON.stringify(config, null, 2));
  console.log(`✅ Remote ${name} added`);
}

if (action === "remove") {
  delete config.remotes[name];
  fs.writeFileSync("mf.config.json", JSON.stringify(config, null, 2));
  console.log(`❌ Remote ${name} removed`);
}
