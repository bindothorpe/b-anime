"use client";
import { useAuth } from "@/app/providers/auth-provider";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  console.log(user);

  return (
    <div>
      <h1>Profile</h1>
      <p>Hi, {user?.username}</p>
    </div>
  );
}
