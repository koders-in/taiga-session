import axios from "axios";

const TAIGA_API_URL =
  process.env.TAIGA_API_URL || "https://taiga.koders.in/api/v1";

// Helper function to make authenticated requests to Taiga API
const makeTaigaRequest = async (token, method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${TAIGA_API_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error("Taiga API request failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      error.status = error.response.status;
      error.data = error.response.data;
    }
    throw error;
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    // First get user info to get user ID
    const user = await makeTaigaRequest(token, "get", "/users/me");

    // Then get projects where user is a member
    const projects = await makeTaigaRequest(
      token,
      "get",
      `/projects?member=${user.id}`
    );

    // Format the response to only include necessary fields
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      logo_small_url: project.logo_small_url,
    }));

    res.status(200).json({
      success: true,
      data: formattedProjects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.data?.message || "Failed to fetch projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // Get user info to filter tasks assigned to this user
    const user = await makeTaigaRequest(token, "get", "/users/me");

    // Get tasks assigned to the user in this project
    const tasks = await makeTaigaRequest(
      token,
      "get",
      `/tasks?project=${projectId}&assigned_to=${user.id}`
    );

    // Format the response
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      ref: task.ref,
      subject: task.subject,
      description: task.description,
      status: task.status_extra_info?.name || "No Status",
      status_color: task.status_extra_info?.color || "#999",
      assigned_to:
        task.assigned_to_extra_info?.full_name_display || "Unassigned",
      created_date: task.created_date,
      modified_date: task.modified_date,
      is_closed: task.is_closed,
    }));

    res.status(200).json({
      success: true,
      data: formattedTasks,
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.data?.message || "Failed to fetch project tasks",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
