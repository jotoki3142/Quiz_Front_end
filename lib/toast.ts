import toast from "react-hot-toast";

/**
 * @param message
 * @param type
 * @param duration
 */
const showToast = (
  message: string,
  type: "success" | "error",
  duration: number = 3000
) => {

  if (type === "success") {
    toast.success(message, { duration });
  } else {
    toast.error(message, { duration });
  }
};

export const toastSuccess = (message: string, duration?: number) => {
  showToast(message, "success", duration);
};

export const toastError = (message: string, duration?: number) => {
  showToast(message, "error", duration);
};
