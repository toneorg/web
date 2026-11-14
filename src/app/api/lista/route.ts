import { receive } from "@/lib/leads";

/** The person's waiting list, from the home page. */
export async function POST(request: Request) {
  return receive("waitlist", request);
}
