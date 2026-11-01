import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const feedUrl = process.env.CTX_FEED_URL?.trim();
  if (!feedUrl) {
    return NextResponse.json(
      { error: "CTX_FEED_URL is not configured." },
      { status: 500 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(feedUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "CTX feed could not be fetched." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "CTX feed could not be fetched." },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
