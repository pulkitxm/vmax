import { Dashboard } from "@/components/dashboard";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "JouleIQ Dashboard",
  "A mocked engineer dashboard for exploring energy-aware race decisions, counterfactuals, risk, and physical HIL telemetry.",
  "/dashboard",
);

export default function DashboardPage() {
  return <Dashboard />;
}
