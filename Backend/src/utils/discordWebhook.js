import axios from "axios";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordMessage(content, embedData = null) {
  try {
    const payload = {
      username: "Action Twayo ✅", // Bot display name
      avatar_url: "https://i.imgur.com/F9Xn8h3.png", // Bot avatar
      content: content,
    };

    if (embedData) {
      // If startTime exists, convert to Discord timestamp
      if (embedData.startTime) {
        const unixTimestamp = Math.floor(
          new Date(embedData.startTime).getTime() / 1000
        );
        embedData.startTime = `<t:${unixTimestamp}:F>`;
      }

      // Set embed color based on status
      let color = 3066993; // default green
      if (embedData.status) {
        const statusLower = embedData.status.toLowerCase();
        if (statusLower === "pause" || statusLower === "resume") {
          color = 16776960; // yellow
        } else if (statusLower === "end") {
          color = 15158332; // red
        }
      }

      // Auto-build embed
      payload.embeds = [
        {
          color: color,
          title: embedData.title || embedData.Title || "Details",
          description: embedData.description || "",
          fields: [
            embedData.sessionId && {
              name: "Session ID",
              value: embedData.sessionId.toString(),
            },
            embedData.startTime && {
              name: "Start Time",
              value: embedData.startTime,
            },
            embedData.status && {
              name: "Status",
              value: embedData.status,
            },
          ].filter(Boolean),
        },
      ];
    }

    const res = await axios.post(DISCORD_WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Message sent to Discord:", res.status);
  } catch (error) {
    console.error(
      "Failed to send message",
      error.response?.data || error.message
    );
  }
}
