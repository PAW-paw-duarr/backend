import { z } from "zod";

const envSchema = z.object({
  MONGO_URL: z.url("Invalid MongoDB URL format"),
  PORT: z
    .string()
    .refine((port) => parseInt(port, 10) > 0 && parseInt(port, 10) < 65536, "Invalid port number")
    .optional()
    .default("3000"),
});

const env: z.infer<typeof envSchema> = envSchema.parse({
  MONGO_URL: process.env.MONGO_URL,
  PORT: process.env.PORT,
});

export function validateEnv(): boolean {
  try {
    envSchema.parse(env);
    return true;
  } catch (error) {
    console.error("Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.core.$ZodIssue) => {
        console.error(`  • ${err.path.join(".")}: ${err.message}`);
      });
    }
    return false;
  }
}

export default env;
