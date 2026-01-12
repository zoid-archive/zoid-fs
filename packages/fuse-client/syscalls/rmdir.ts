import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import pathModule from "path";

export const rmdir: (backend: SQLiteBackend) => MountOptions["rmdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("rmdir(%s)", path);

    // Check if directory is empty
    const isEmpty = await backend.isDirectoryEmpty(path);
    if (!isEmpty) {
      cb(fuse.ENOTEMPTY);
      return;
    }

    const r = await backend.deleteFile(path);
    if (r.status === "ok") {
      // Update parent directory mtime and ctime
      const parsedPath = pathModule.parse(path);
      await backend.touchDirectory(parsedPath.dir || "/");
      cb(0);
    } else {
      cb(fuse.ENOENT);
    }
  };
};
