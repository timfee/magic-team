export const dynamic = "force-dynamic";

export async function GET() {
  // Socket.io is handled by the custom server
  // This route exists to satisfy Next.js routing
  return new Response("Socket.io server is running via custom server", {
    status: 200,
  });
}
