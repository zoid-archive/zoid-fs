import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import path from "path";
export const mkdir: (backend: SQLiteBackend) => MountOptions["mkdir"] = (
  backend
) => {
  return async (filepath, mode, cb) => {
    console.info("mkdir(%s, %s)", filepath, mode);
    const parsedPath = path.parse(filepath);
    const filename = parsedPath.base;

    if (filename.length > 255) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    const dir = await backend.createFile(filepath, "dir", mode, uid, gid);
    if (dir.status === "ok") {
      // Update parent directory mtime and ctime
      await backend.touchDirectory(parsedPath.dir || "/");
      cb(0);
    } else {
      cb(fuse.EACCES);
    }
  };
};
