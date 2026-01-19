import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import ThinkSoftLogoWhite from "#/assets/branding/thinksoft-logo-white.svg?react";

export interface LoginContentProps {
  // Props no longer needed since Clerk handles authentication
}

export function LoginContent({}: LoginContentProps) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  if (isSignedIn) {
    return null; // Don't render anything if already signed in
  }
  return (
    <div
      className="flex flex-col items-center w-full gap-12.5 min-h-screen justify-center"
      data-testid="login-content"
    >
      <div className="mb-8">
        <div className="w-[106px] h-[72px] bg-white/10 rounded-lg flex items-center justify-center">
          {/* ThinkSoft Logo Placeholder */}
          <span className="text-white text-lg font-bold">ThinkSoft</span>
        </div>
      </div>

      <h1 className="text-[39px] leading-5 font-medium text-white text-center mb-8">
        {t(I18nKey.AUTH$LETS_GET_STARTED)}
      </h1>

      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#9E28B0] hover:bg-[#7A1F88] text-white",
              card: "bg-white/10 backdrop-blur-sm border border-white/20",
              headerTitle: "text-white",
              headerSubtitle: "text-white/70",
              socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
              formFieldLabel: "text-white",
              formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-white/50",
              footerActionLink: "text-[#9E28B0] hover:text-[#7A1F88]",
            }
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
