import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import pathModule from "path";

export const rename: (backend: SQLiteBackend) => MountOptions["rename"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("rename(%s, %s)", srcPath, destPath);

    if (backend.isVirtualFile(srcPath)) {
      await backend.createFile(destPath, "file", 33188, 0, 0);
      cb(0);
      return;
    }

    const r = await backend.renameFile(srcPath, destPath);
    if (r.status === "ok") {
      // Update both source and destination parent directory mtime and ctime
      const parsedSrcPath = pathModule.parse(srcPath);
      const parsedDestPath = pathModule.parse(destPath);
      await backend.touchDirectory(parsedSrcPath.dir || "/");
      if (parsedSrcPath.dir !== parsedDestPath.dir) {
        await backend.touchDirectory(parsedDestPath.dir || "/");
      }
      cb(0);
    } else {
      // TODO: can move fail, if yes, when?
      // For example when dest doesn't exist??
      cb(fuse.ENOENT);
    }
  };
};
