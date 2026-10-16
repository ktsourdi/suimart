import type { Metadata } from "next";
import dynamic from "next/dynamic";

// The profile reads the connected wallet, which only exists in the browser.
const ProfileClient = dynamic(() => import("../../components/ProfileClient"), {
  ssr: false,
  loading: () => <ProfileLoading />,
});

export const metadata: Metadata = {
  title: "Profile",
  description: "Your SuiMart listings, bids, purchases and activity.",
};

/** Holds the page's height while the client bundle loads, so the footer does not jump up. */
function ProfileLoading() {
  return (
    <div className="container-page min-h-[60vh] pt-10 sm:pt-14" role="status">
      <span className="sr-only">Loading profile</span>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileClient />;
}
