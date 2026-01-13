import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse from "@zoid-fs/node-fuse-bindings";
import { rename } from "./syscalls/rename";
import { unlink } from "./syscalls/unlink";
import { mkdir } from "./syscalls/mkdir";
import { flush } from "./syscalls/flush";
import { read } from "./syscalls/read";
import { open } from "./syscalls/open";
import { utimens } from "./syscalls/utimens";
import { getattr } from "./syscalls/getattr";
import { symlink } from "./syscalls/symlink";
import { readdir } from "./syscalls/readdir";
import { statfs } from "./syscalls/statfs";
import { fsync } from "./syscalls/fsync";
import { link } from "./syscalls/link";
import { create } from "./syscalls/create";
import { truncate } from "./syscalls/truncate";
import { write } from "./syscalls/write";
import { init } from "./syscalls/init";
import { destroy } from "./syscalls/destroy";
import { fgetattr } from "./syscalls/fgetattr";
import { access } from "./syscalls/access";
import { chmod } from "./syscalls/chmod";
import { chown } from "./syscalls/chown";
import { fsyncdir } from "./syscalls/fsyncdir";
import { ftruncate } from "./syscalls/ftruncate";
import { getxattr } from "./syscalls/getxattr";
import { listxattr } from "./syscalls/listxattr";
import { mknod } from "./syscalls/mknod";
import { opendir } from "./syscalls/opendir";
import { readlink } from "./syscalls/readlink";
import { release } from "./syscalls/release";
import { releasedir } from "./syscalls/releasedir";
import { removexattr } from "./syscalls/removexattr";
import { rmdir } from "./syscalls/rmdir";
import { setxattr } from "./syscalls/setxattr";

/**
 * https://www.cs.hmc.edu/~geoff/classes/hmc.cs135.201109/homework/fuse/fuse_doc.html
 * https://www.kernel.org/doc/html/next/filesystems/fuse.html
 * https://opensource.com/article/19/8/dig-binary-files-hexdump
 * diff <(xxd 1.png) <(xxd 1/1.png)
 *
 * https://github.com/greenbender/sqlfs/blob/master/sqlfs.py
 *
 */
export class FuseClient {
  constructor(private backend: SQLiteBackend) {}

  mountFS(mountPath: string) {
    fuse.mount(
      mountPath,
      {
        force: true,
        options: ["attr_timeout=0", "entry_timeout=0"],
        init: init(this.backend),
        destroy: destroy(this.backend),
        getattr: getattr(this.backend),
        fgetattr: fgetattr(this.backend),
        access: access(this.backend),
        readlink: readlink(this.backend),
        opendir: opendir(this.backend),
        readdir: readdir(this.backend),
        mknod: mknod(this.backend),
        mkdir: mkdir(this.backend),
        unlink: unlink(this.backend),
        rmdir: rmdir(this.backend),
        symlink: symlink(this.backend),
        rename: rename(this.backend),
        link: link(this.backend),
        chmod: chmod(this.backend),
        chown: chown(this.backend),
        truncate: truncate(this.backend),
        ftruncate: ftruncate(this.backend),
        utimens: utimens(this.backend),
        create: create(this.backend),
        open: open(this.backend),
        read: read(this.backend),
        write: write(this.backend),
        statfs: statfs(this.backend),
        release: release(this.backend),
        releasedir: releasedir(this.backend),
        fsync: fsync(this.backend),
        fsyncdir: fsyncdir(this.backend),
        flush: flush(this.backend),
        // lock: lock(this.backend), // Note: not implemented in bindings
        // bmap: bmap(this.backend), // Note: not implemented in bindings
        setxattr: setxattr(this.backend),
        getxattr: getxattr(this.backend),
        listxattr: listxattr(this.backend),
        removexattr: removexattr(this.backend),
        // ioctl: ioctl(this.backend), // Note: not implemented in bindings
        // poll: poll(this.backend), // Note: not implemented in bindings
      },
      (err) => {
        if (err) {
          this.unmountFS(mountPath);
          throw err;
        }
        console.info("filesystem mounted on " + mountPath);
      }
    );
  }

  unmountFS(mountPath: string) {
    fuse.unmount(mountPath, (err) => {
      if (err) {
        console.info(
          "filesystem at " + mountPath + " not unmounted",
          err.toString()
        );
      } else {
        console.info("filesystem at " + mountPath + " unmounted");
      }
    });
  }
}
