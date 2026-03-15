"use client";

import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-xl bg-muted sm:min-h-[500px]" />
  ),
});

export default function LocationMapWrapper() {
  return <LocationMap />;
}
