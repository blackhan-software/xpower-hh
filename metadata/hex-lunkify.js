const { readdir, unlink } = require("fs/promises");
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
async function unlinkify(src_path) {
  const tgt_path = await hex_path(src_path);
  if (tgt_path)
    try {
      console.log(`rm ${tgt_path}`);
      await unlink(tgt_path);
    } catch (e) {
      console.error(e);
    }
}
async function hex_path(path) {
  const regex = /(?<id>[0-9a-f]{64})\.json$/;
  const match = path.match(regex);
  if (match?.groups?.id) {
    return path;
  }
}
if (require.main === module) {
  walk(argv.length > 2 ? argv[2] : ".", unlinkify);
}
