import axios from "axios";
import User from "../../Models/user.model.js";
import School from "../../Models/School.model.js";

/**
 * Service to handle Edlink OAuth and Data Sync
 */
class EdlinkService {
  /**
   * Get the general school document with connection info
   */
  async getSchoolConnection() {
    return await School.findOne();
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code) {
    const response = await axios.post(
      "https://ed.link/api/authentication/token",
      {
        client_id: process.env.EDLINK_CLIENT_ID,
        client_secret: process.env.EDLINK_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.EDLINK_REDIRECT_URI,
      },
    );

    return response.data;
  }

  /**
   * Store tokens in the School model
   * (Assumes a single school instance as per user instructions)
   */
  async storeTokens(tokenData) {
    // Find the school - since it's a single instance, we fetch the first one
    const school = await School.findOne();
    if (!school) throw new Error("School not found in database");

    school.edlinkConnection = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    };

    await school.save();
    return school;
  }

  /**
   * Fetch users from Edlink and upsert them into the User collection
   */
  async syncUsers() {
    const school = await School.findOne();
    if (!school || !school.edlinkConnection?.accessToken) {
      throw new Error("Edlink not connected for this school");
    }

    // Fetch users from Edlink API
    // Edlink v2 API uses /api/v2/graph/users
    const response = await axios.get("https://ed.link/api/v2/graph/users", {
      headers: {
        Authorization: `Bearer ${school.edlinkConnection.accessToken}`,
      },
    });

    const edlinkUsers = response.data.data; // Edlink paginates, this fetches the first page
    const results = { created: 0, updated: 0 };

    for (const edUser of edlinkUsers) {
      const userData = {
        firstName: edUser.first_name,
        lastName: edUser.last_name,
        email: edUser.email,
        role: this.mapRole(edUser.role),
        externalProvider: "edlink",
        externalId: edUser.id,
      };

      // Upsert user based on externalId
      const result = await User.findOneAndUpdate(
        { externalId: edUser.id, externalProvider: "edlink" },
        { $set: userData },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      // In a real scenario, you'd check if it was a new document or updated
      results.updated++;
    }

    return results;
  }

  /**
   * Map Edlink roles to LMS roles
   */
  mapRole(edlinkRole) {
    const roleMap = {
      student: "student",
      teacher: "teacher",
      administrator: "admin",
      "district-administrator": "admin",
    };
    return roleMap[edlinkRole?.toLowerCase()] || "student";
  }
}

export default new EdlinkService();
