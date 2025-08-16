import axios from "axios";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// desc: Helper Function formats name, TODO: Save this Function in a different folder

function formatName(rawName) {
  if (!rawName) return "";

  // Replace underscores/dots with spaces
  let name = rawName.replace(/[_\.]/g, " ");

  // Insert space before capital letters (camelCase → camel Case)
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Capitalize each word
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export async function sendDiscordMessage(content, embedData = null) {
  try {
    const payload = {
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

      payload.embeds = [
        {
          author: {
            name: `🔴 ${formatName(embedData.name)}` || "Pomodoro Timer",
          },
          title: `📝 Task: ${embedData.title || embedData.Title || "No Task"}`,
          color: color,

          fields: [
            embedData.sessionId && {
              name: "🆔 Session",
              value: `\`${embedData.sessionId}\``,
              inline: false,
            },
            embedData.startTime && {
              name: "🕒 Started",
              value: embedData.startTime,
              inline: true,
            },
            embedData.status && {
              name: "📌 Status",
              value: embedData.status,
              inline: true,
            },
          ].filter(Boolean),

          timestamp: new Date(),
          footer: {
            text: "⏱ Stay focused!",
          },
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
