# Zoom Integration Setup Guide

## 1. Credentials Configuration

To enable Zoom integration, you need to create a **Server-to-Server OAuth** app in the Zoom Marketplace.

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/).
2. Click **Develop** > **Build App**.
3. Choose **Server-to-Server OAuth** and click **Create**.
4. Fill in the App Name and other details.
5. In the **Scopes** tab, add the following scopes:
   - `meeting:write:admin` or `meeting:write`
   - `meeting:read:admin` or `meeting:read`
   - `user:read:admin` or `user:read` (to fetch user details if needed)
6. In the **App Credentials** tab, copy your:
   - Account ID
   - Client ID
   - Client Secret

### Update `.env`

Add the following lines to your backend `.env` file:

```env
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
```

## 2. Switching from Free to Paid Plan

This integration is designed to be **future-proof**.

- **Current Behavior (Free Plan)**: Meetings created via API will have a 40-minute limit enforced by Zoom.
- **Upgrading**: When you are ready to upgrade:
  1. Purchase a **Pro (or higher)** license for the Zoom account linked to the credentials above.
  2. Assign the license to the user (Host) in the Zoom Admin Dashboard.
  3. **No code changes are required.** Zoom will automatically lift the 40-minute limit for new and existing meetings hosted by a licensed user.
  4. Cloud Recording will become available (you can enable `auto_recording: "cloud"` in `Zoom.Controller.js` if desired, currently defaults to off).

## 3. Frontend Integration Guide

Since Jitsi (an embedded iframe) has been removed, update your frontend to use a **Redirect Flow**:

### Teacher (Start Class)

1. Fetch meetings: `GET /api/zoom/course/:courseId`
2. Display a **"Start Class"** button for the meeting.
3. On click, call: `GET /api/zoom/join/:meetingId`
4. Redirect the teacher to the returned `url` (this is the `start_url`).

### Student (Join Class)

1. Fetch meetings: `GET /api/zoom/course/:courseId`
2. Display a **"Join Class"** button.
3. On click, call: `GET /api/zoom/join/:meetingId`
4. Redirect the student to the returned `url` (this is the `join_url`).

**Note**: Students do NOT need a Zoom account. They can join as guests via the web or Zoom app.


