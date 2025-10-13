import { Server as NetServer } from "http";
import { NextRequest } from "next/server";
import { initSocketServer } from "@/lib/socket/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // In Next.js 15 with App Router, we need to handle Socket.io differently
  // This endpoint serves as a health check and initializer

  // Check if Socket.io is initialized
  const { getSocketServer } = await import("@/lib/socket/server");
  const io = getSocketServer();

  if (io) {
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Socket.io server is running",
        path: "/api/socket",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      status: "not_initialized",
      message: "Socket.io server not initialized",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    },
  );
}
