// OS permission is the source of truth. Never persist a fake "granted" flag.
export interface ForegroundPermission {
  status: string;
  canAskAgain: boolean;
}

export function createPermissionPolicy<T extends ForegroundPermission>(
  read: () => Promise<T>,
  request: () => Promise<T>,
) {
  let pending: Promise<T> | null = null;
  return function ensurePermission(retryDenied = false): Promise<T> {
    if (pending) return pending;
    pending = (async () => {
      const permission = await read();
      if (permission.status === "granted" || !permission.canAskAgain)
        return permission;
      if (permission.status === "undetermined" || retryDenied) return request();
      return permission;
    })().finally(() => {
      pending = null;
    });
    return pending;
  };
}
