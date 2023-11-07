const { readdir, link } = require("fs/promises");
const { join } = require("path");
const { argv } = require("process");

async function walk(path, callback) {
  const dirents = await readdir(path, {
    withFileTypes: true,
  });
  for (const dirent of dirents) {
    const fullpath = join(path, dirent.name);
    if (dirent.isDirectory()) {
      await walk(fullpath, callback);
    } else {
      callback(fullpath);
    }
  }
}
async function relinkify(src_path) {
  const tgt_path = await hex_path(src_path);
  if (tgt_path)
    try {
      console.log(`ln -s ${src_path} ${tgt_path}`);
      await link(src_path, tgt_path);
    } catch (e) {
      console.error(e);
    }
}
async function hex_path(path) {
  const regex = /(?<id>[1-9][0-9]+)\.json$/;
  const match = path.match(regex);
  if (match?.groups?.id) {
    const hexed = Number(match?.groups?.id).toString(16);
    const ident = "0".repeat(64 - hexed.length) + hexed;
    return path.replace(regex, ident + ".json");
  }
}
if (require.main === module) {
  walk(argv.length > 2 ? argv[2] : ".", relinkify);
}
