import React from "react";
import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-4">
      <SignIn path="/login" routing="path" signUpUrl="/signup" />
    </div>
  );
}
