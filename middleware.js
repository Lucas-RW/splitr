import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { MetricsClient } from '@/lib/metrics/client.js';

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/expenses(.*)",
  "/contacts(.*)",
  "/groups(.*)",
  "/person(.*)",
  "/settlements(.*)",
]);

const metricsClient = new MetricsClient(process.env.METRICS_ENDPOINT);

function normalizePath(pathname) {
  return pathname
    .replace(/\/\d+/g, "/:id") 
    .replace(/\/[a-f0-9-]{36}/g, "/:uuid");
}

export default clerkMiddleware(async (auth, req) => {
  const start = performance.now();

  let response;

  try {
    const { userId } = await auth();

    if (!userId && isProtectedRoute(req)) {
      const { redirectToSignIn } = await auth();
      response = redirectToSignIn();
    } else {
      response = NextResponse.next();
    }

  } catch (err) {
    void metricsClient.increment("http_errors_total", {
      error: "middleware_exception",
      path: req.nextUrl.pathname,
    });

    throw err;
  } finally {
    const duration = performance.now() - start;

    const labels = {
      method: req.method,
      path: normalizePath(req.nextUrl.pathname),
      status: String(response?.status ?? 200),
    };

    void metricsClient.increment("http_requests_total", labels);
    void metricsClient.observe("http_request_duration_ms", duration, labels);
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};