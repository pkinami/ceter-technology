const fs = require("fs");
const path = require("path");

const originalSymlink = fs.symlink;
const originalSymlinkSync = fs.symlinkSync;
const originalPromisesSymlink = fs.promises && fs.promises.symlink;

function shouldRetryAsJunction(error, target, destination, type) {
  if (process.platform !== "win32") return false;
  if (!error || error.code !== "EPERM") return false;
  if (type) return false;
  if (typeof destination !== "string" || !destination.endsWith(".func")) {
    return false;
  }

  const resolvedTarget = path.resolve(path.dirname(destination), String(target));
  try {
    return fs.statSync(resolvedTarget).isDirectory();
  } catch {
    return false;
  }
}

function resolveJunctionTarget(target, destination) {
  return path.resolve(path.dirname(destination), String(target));
}

if (originalPromisesSymlink) {
  fs.promises.symlink = async function symlinkWithJunctionFallback(
    target,
    destination,
    type,
  ) {
    try {
      return await originalPromisesSymlink.call(
        this,
        target,
        destination,
        type,
      );
    } catch (error) {
      if (!shouldRetryAsJunction(error, target, destination, type)) {
        throw error;
      }

      return originalPromisesSymlink.call(
        this,
        resolveJunctionTarget(target, destination),
        destination,
        "junction",
      );
    }
  };
}

fs.symlink = function symlinkWithJunctionFallback(
  target,
  destination,
  type,
  callback,
) {
  if (typeof type === "function") {
    callback = type;
    type = undefined;
  }

  return originalSymlink.call(this, target, destination, type, (error) => {
    if (!shouldRetryAsJunction(error, target, destination, type)) {
      callback(error);
      return;
    }

    originalSymlink.call(
      this,
      resolveJunctionTarget(target, destination),
      destination,
      "junction",
      callback,
    );
  });
};

fs.symlinkSync = function symlinkSyncWithJunctionFallback(
  target,
  destination,
  type,
) {
  try {
    return originalSymlinkSync.call(this, target, destination, type);
  } catch (error) {
    if (!shouldRetryAsJunction(error, target, destination, type)) {
      throw error;
    }

    return originalSymlinkSync.call(
      this,
      resolveJunctionTarget(target, destination),
      destination,
      "junction",
    );
  }
};
