import * as Location from "expo-location";
import { createPermissionPolicy } from "./permission-policy";

export const ensureForegroundPermission = createPermissionPolicy(
  () => Location.getForegroundPermissionsAsync(),
  () => Location.requestForegroundPermissionsAsync(),
);
