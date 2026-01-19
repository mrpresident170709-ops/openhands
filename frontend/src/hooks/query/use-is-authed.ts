import { useAuth } from "@clerk/clerk-react";
import { useConfig } from "./use-config";
import { useIsOnTosPage } from "#/hooks/use-is-on-tos-page";

export const useIsAuthed = () => {
  const { data: config } = useConfig();
  const isOnTosPage = useIsOnTosPage();
  const { isSignedIn, isLoaded } = useAuth();

  const appMode = config?.APP_MODE;

  // For OSS mode, always return authenticated
  if (appMode === "oss") {
    return {
      data: true,
      isLoading: false,
      error: null,
    };
  }

  // For SaaS mode, use Clerk authentication status
  return {
    data: isSignedIn,
    isLoading: !isLoaded || isOnTosPage,
    error: null,
  };
};
