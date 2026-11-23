import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? SITE_NAME).slice(0, 140);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 64,
        backgroundColor: "#172554",
        color: "#ffffff",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: "#93c5fd", letterSpacing: 2 }}>
        THE DAILY PULSE
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
      <div style={{ fontSize: 22, color: "#cbd5e1" }}>
        Lifestyle · Personal Finance · Technology · Breaking News
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
