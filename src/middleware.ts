import { withClerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Set the paths that don't require authentication
const publicPaths = [
  "/",
  "/sign-in*",
  "/sign-up*",
  "/api/trpc*",
  "/api/webhook*"
];

// Check if the current path is in the public paths
const isPublic = (path: string) => {
  return publicPaths.some((publicPath) => {
    return path.match(new RegExp(`^${publicPath}$`.replace("*", ".*")));
  });
};

export default withClerkMiddleware((req: NextRequest) => {
  const { userId } = getAuth(req);
  const path = req.nextUrl.pathname;

  if (!userId && !isPublic(path)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
