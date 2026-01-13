import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
import pathModule from "path";

export const truncate: (backend: SQLiteBackend) => MountOptions["truncate"] = (
  backend
) => {
  return async (path, size, cb) => {
    console.info("truncate(%s, %d)", path, size);

    // Check for ENAMETOOLONG - component name exceeds 255 chars
    const parsedPath = pathModule.parse(path);
    if (parsedPath.base.length > 255) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    if (backend.isVirtualFile(path)) {
      cb(0);
      return;
    }

    const r = await backend.truncateFile(path, size);
    await match(r)
      .with({ status: "ok" }, async (r) => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
