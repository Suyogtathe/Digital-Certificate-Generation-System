//E:\DigitalCertificateSystem\frontend\src\utils\getUserId.js


export const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?._id || user?.id || null;
  } catch {
    return null;
  }
};
