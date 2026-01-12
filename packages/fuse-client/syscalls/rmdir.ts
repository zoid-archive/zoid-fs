import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
import pathModule from "path";

export const rmdir: (backend: SQLiteBackend) => MountOptions["rmdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("rmdir(%s)", path);
    const r = await backend.deleteFile(path);
    match(r)
      .with({ status: "ok" }, async (r) => {
        // Update parent directory mtime and ctime
        const parsedPath = pathModule.parse(path);
        await backend.touchDirectory(parsedPath.dir || "/");
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
