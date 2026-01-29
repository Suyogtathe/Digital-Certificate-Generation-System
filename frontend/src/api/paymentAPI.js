//E:\DigitalCertificateSystem\frontend\src\api\paymentAPI.js
import API from "./axiosInstance";

export const createOrder = (data) => API.post("/payments/create-order", data);

export const verifyPayment = (data) => API.post("/payments/verify", data);
