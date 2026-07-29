import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/java-tutorial")({
  component: () => <Outlet />,
});
