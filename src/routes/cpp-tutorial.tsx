import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/cpp-tutorial")({
  component: () => <Outlet />,
});
