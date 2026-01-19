import { openHands } from "../thinksoft-axios";
import { AuthenticateResponse } from "./auth.types";
import { GetConfigResponse } from "../option-service/option.types";

/**
 * Authentication service for handling Clerk authentication
 */
class AuthService {
  /**
   * Authenticate with Clerk
   * @param appMode The application mode (saas or oss)
   * @returns Response with authentication status and user info if successful
   */
  static async authenticate(
    appMode: GetConfigResponse["APP_MODE"],
  ): Promise<boolean> {
    if (appMode === "oss") return true;

    try {
      // The AuthWrapper already sets the Authorization header with Clerk token
      await openHands.post<AuthenticateResponse>("/api/authenticate");
      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  }

  /**
   * Logout user from the application
   * @param appMode The application mode (saas or oss)
   */
  static async logout(appMode: GetConfigResponse["APP_MODE"]): Promise<void> {
    const endpoint =
      appMode === "saas" ? "/api/logout" : "/api/unset-provider-tokens";
    await openHands.post(endpoint);
  }
}

export default AuthService;
