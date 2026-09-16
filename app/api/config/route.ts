import { bindings, json } from "@/lib/server";
import { DEFAULT_MODEL } from "@/lib/nebius";
export function GET() {
  const e = bindings();
  return json({
    liveAvailable: !!e.NEBIUS_API_KEY,
    model: e.NEBIUS_MODEL || DEFAULT_MODEL,
    provider: "Nebius Token Factory",
  });
}
