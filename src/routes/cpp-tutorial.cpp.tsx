import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/cpp-tutorial/cpp")({
  component: () => <Outlet />,
});
