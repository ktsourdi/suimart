import dynamic from "next/dynamic";

// Dynamically import HomeClient with SSR disabled to ensure it's only rendered on the client.
const HomeClient = dynamic(() => import("../components/HomeClient"), { ssr: false });

export default function HomePage() {
  return <HomeClient />;
}