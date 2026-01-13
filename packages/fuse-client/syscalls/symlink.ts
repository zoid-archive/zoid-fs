import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
import { constants } from "fs";
import path from "path";

export const symlink: (backend: SQLiteBackend) => MountOptions["symlink"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("symlink(%s, %s)", srcPath, destPath);

    const parsedDestPath = path.parse(destPath);
    // NAME_MAX on Linux is 255
    if (parsedDestPath.base.length > 255) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    // PATH_MAX on Linux is 4096
    if (destPath.length > 4095) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    const r = await backend.createFile(
      destPath,
      "symlink",
      constants.S_IFLNK | 0o777, // Symlinks should have 0o120777 mode
      uid,
      gid,
      srcPath
    );
    match(r)
      .with({ status: "ok" }, async () => {
        // Update parent directory mtime and ctime
        await backend.touchDirectory(parsedDestPath.dir || "/");
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
