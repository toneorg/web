import { receive } from "@/lib/leads";

/** A store asking for a pilot, from /lojas. */
export async function POST(request: Request) {
  return receive("pilot", request);
}
