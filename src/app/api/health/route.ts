export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Simple health check - just confirm the server is running
    // Database check is optional since it may need time to initialize
    return Response.json({ ok: true, timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
