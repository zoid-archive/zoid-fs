import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import pathModule from "path";

export const create: (backend: SQLiteBackend) => MountOptions["create"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.info("create(%s, %d)", path, mode);

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    const r = await backend.createFile(path, "file", mode, uid, gid);
    if (r.status === "ok") {
      // Update parent directory mtime and ctime
      const parsedPath = pathModule.parse(path);
      await backend.touchDirectory(parsedPath.dir || "/");
      cb(0);
    } else {
      // Handle the error case
      cb(fuse.EACCES);
    }
  };
};
