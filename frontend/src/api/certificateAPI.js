//E:\DigitalCertificateSystem\frontend\src\api\certificateAPI.js
import API from "./axiosInstance";

export const generateCertificate = (data) =>
  API.post("/certificates/generate", data);

export const getMyCertificates = () => API.get("/certificates/my");

export const downloadCertificate = (certificateId) =>
  API.get(`/certificates/download/${certificateId}`, {
    responseType: "blob",
  });
