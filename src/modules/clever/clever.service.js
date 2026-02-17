import User from "../../Models/user.model.js";
import {
  CLEVER_CONFIG,
  ROLE_MAPPING,
  fetchWithTimeout,
  handleFetchResponse,
} from "./clever.utils.js";

class CleverService {
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    const authHeader = Buffer.from(
      `${CLEVER_CONFIG.clientId}:${CLEVER_CONFIG.clientSecret}`,
    ).toString("base64");

    const response = await fetchWithTimeout(CLEVER_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: CLEVER_CONFIG.redirectUri,
      }),
    });

    return handleFetchResponse(response, "Exchange Code");
  }

  /**
   * Get user profile from Clever
   */
  async getUserProfile(accessToken) {
    const response = await fetchWithTimeout(`${CLEVER_CONFIG.apiUrl}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleFetchResponse(response, "Get Profile");
  }

  /**
   * Get user details (including roles and schools)
   */
  async getUserDetails(accessToken, userType, cleverUserId) {
    // Clever API structure depends on user type
    // Endpoint: /v3.0/{user_type}s/{id}
    const endpointMapping = {
      student: "students",
      teacher: "teachers",
      district_admin: "district_admins",
      school_admin: "school_admins",
    };

    const typePath = endpointMapping[userType];
    if (!typePath) return null;

    const response = await fetchWithTimeout(
      `${CLEVER_CONFIG.apiUrl}/${typePath}/${cleverUserId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return handleFetchResponse(response, "Get Details");
  }

  /**
   * Sync or create user in database
   */
  async processCleverUser(cleverData) {
    const { id: cleverId, type, name, email, district, schools } = cleverData;

    // Validate districtId if required
    if (CLEVER_CONFIG.districtId && district !== CLEVER_CONFIG.districtId) {
      console.error(
        `District mismatch: Expected ${CLEVER_CONFIG.districtId}, got ${district}`,
      );
      throw new Error("Unauthorized district access");
    }

    const role = ROLE_MAPPING[type] || "student";
    const firstName = name?.first || name?.full?.split(" ")[0] || "User";
    const lastName =
      name?.last || name?.full?.split(" ").slice(1).join(" ") || "Clever";

    // Find existing user by cleverId or email
    let user = await User.findOne({ cleverId });

    if (!user && email) {
      // Check if email belongs to a local account
      user = await User.findOne({ email });
      if (user && user.authProvider !== "clever") {
        // Option 1: Link accounts (if email matches and they trust Clever)
        // Option 2: Reject (to prevent account hijacking)
        // Given requirements: "Never create duplicate users by email unless authProvider matches."
        // We'll update provider if user exists? The requirement is a bit ambiguous.
        // Usually, linking is better. But I'll stick to the "sync" logic.
        user.cleverId = cleverId;
        user.authProvider = "clever";
      }
    }

    const userData = {
      firstName,
      lastName,
      email,
      cleverId,
      districtId: district,
      schoolIds: schools || [],
      authProvider: "clever",
      role,
    };

    if (user) {
      // Update existing user
      Object.assign(user, userData);
      await user.save();
    } else {
      // Create new user
      user = new User(userData);
      await user.save();
    }

    return user;
  }

  /**
   * Placeholder for future roster sync support
   */
  async syncDistrictRoster(districtId) {
    console.log(`Syncing roster for district: ${districtId}`);
    // Future implementation: fetch /sections, /students, /teachers
  }
}

export default new CleverService();
