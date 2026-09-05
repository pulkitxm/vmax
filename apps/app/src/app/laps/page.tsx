import { LapReview } from "@/components/lap-review";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Lap Status",
  "Debrief every lap: where boost was used, accuracy and timing error versus the VMAX model, and the advantage of following the prediction instead of instinct.",
  "/laps",
);

export default function LapsPage() {
  return <LapReview />;
}
