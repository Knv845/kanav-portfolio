import type { Metadata } from "next";
import { Depot } from "@/components/Depot";

// The earlier crane-and-containers home page, kept at /depot (not linked from the site)
export const metadata: Metadata = {
  title: "Kanav Khera · The Depot",
  robots: { index: false },
};

export default function DepotPage() {
  return <Depot />;
}
