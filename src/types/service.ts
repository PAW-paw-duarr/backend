import type { components } from "~/lib/api/schema.js";

type returnData<T = undefined> = T extends undefined
  ?
      | { success: number; data?: T; error?: components["schemas"]["DefaultErrors"] }
      | { success?: undefined; data?: string; error: components["schemas"]["DefaultErrors"] }
  :
      | { success: number; data: T; error?: components["schemas"]["DefaultErrors"] }
      | { success?: undefined; data?: string; error: components["schemas"]["DefaultErrors"] };

export type retService<
  T extends Record<string, unknown> | Array<Record<string, unknown>> | undefined = undefined,
> = Promise<returnData<T>>;
