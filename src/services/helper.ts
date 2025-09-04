import type { components } from "~/lib/api/schema";

type returnData<T> =
  | { success: number; data: T; error?: components["schemas"]["DefaultErrors"] }
  | { success?: undefined; data: string; error: components["schemas"]["DefaultErrors"] };

export type retService<T extends Record<string, unknown>> = Promise<returnData<T>>;
