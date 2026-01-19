import React from "react";
import { SignUp } from "@clerk/clerk-react";

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base p-4">
            <SignUp path="/signup" routing="path" signInUrl="/login" />
        </div>
    );
}
