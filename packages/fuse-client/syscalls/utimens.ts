import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

// UTIME_NOW is represented as a special sentinel value
// When tv_nsec is UTIME_NOW (0x3fffffff), the bindings return garbage (around 1073ms)
// We detect this by checking if the timestamp is unreasonably small (< year 2000)
const YEAR_2000_MS = 946684800000;

export const utimens: (backend: SQLiteBackend) => MountOptions["utimens"] = (
  backend
) => {
  return async (path, atime, mtime, cb) => {
    // Note: atime and mtime are passed as numbers (milliseconds) from node-fuse-bindings
    // When the value is UTIME_NOW, the binding returns garbage (~1073ms), so use current time
    const now = Date.now();
    const atimeMs = atime < YEAR_2000_MS ? now : atime;
    const mtimeMs = mtime < YEAR_2000_MS ? now : mtime;
    console.info("utimens(%s, atime=%d, mtime=%d)", path, atimeMs, mtimeMs);
    try {
      await backend.updateTimesMs(path, atimeMs, mtimeMs);
    } catch (e) {
      console.error(e);
    }
    cb(0);
  };
};
