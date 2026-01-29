//E:\DigitalCertificateSystem\frontend\src\api\templateAPI.js
import API from "./axiosInstance";

// ------------------------------------
// GET ALL TEMPLATES (read-only)
// ------------------------------------
export const fetchTemplates = async () => {
  try {
    const res = await API.get("/templates");
    return res.data.templates;
  } catch (err) {
    throw err.response?.data || { message: "Failed to load templates" };
  }
};
