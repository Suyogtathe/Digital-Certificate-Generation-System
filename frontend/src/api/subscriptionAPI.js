//E:\DigitalCertificateSystem\frontend\src\api\subscriptionAPI.js
import API from "./axiosInstance";

export const getPlans = () => API.get("/subscriptions/plans");
