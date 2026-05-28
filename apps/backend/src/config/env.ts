const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3004",
  "http://localhost:4504",
  "https://new.layered.work",
  "https://dashboard.layered.work",
];

export interface AppEnv {
  readonly databaseUrl: string;
  readonly port: number;
  readonly allowedOrigins: string[];
}

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function readEnv(): AppEnv {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(process.env.PORT ?? "4004");

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("PORT must be a positive number");
  }

  const configuredOrigins = splitOrigins(process.env.CORS_ORIGIN ?? process.env.ALLOWED_ORIGINS);

  return {
    databaseUrl,
    port,
    allowedOrigins: configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS,
  };
}
