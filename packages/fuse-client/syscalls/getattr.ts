import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const getattr: (backend: SQLiteBackend) => MountOptions["getattr"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("getattr(%s)", path);

    if (backend.isVirtualFile(path)) {
      const virtualFile = backend.getVirtualFile(path);
      cb(0, virtualFile.attr);
      return;
    }

    const r = await backend.getFile(path);
    await match(r)
      .with({ status: "ok" }, async (r) => {
        const rSize = await backend.getFileSize(path);
        if (rSize.status !== "ok") {
          cb(fuse.ENOENT);
          return;
        }
        const rNlinks = await backend.getFileNLinks(path);
        const { mtime, atime, ctime, mode } = r.file;
        cb(0, {
          mtime,
          atime,
          ctime,
          blocks: 1,
          ino: r.file.id,
          nlink: rNlinks.nLinks?.length || 1,
          size: rSize.size,
          mode: mode,
          // Note: returning process uid/gid for now to avoid permission issues
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
