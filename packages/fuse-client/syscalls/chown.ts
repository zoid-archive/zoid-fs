import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const chown: (backend: SQLiteBackend) => MountOptions["chown"] = (
  backend
) => {
  return async (path, uid, gid, cb) => {
    console.info("chown(%s, %d, %d)", path, uid, gid);

    if (backend.isVirtualFile(path)) {
      cb(0);
      return;
    }

    const r = await backend.updateOwner(path, uid, gid);
    match(r)
      .with({ status: "ok" }, () => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
