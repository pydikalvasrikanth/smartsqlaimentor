import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/practice")({
  beforeLoad: () => {
    throw redirect({ to: "/mysql", statusCode: 301 });
  },
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.redirect(new URL("/mysql", request.url), 301);
      },
    },
  },
});