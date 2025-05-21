interface ApiError {
  message: string;
}

export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === "object" && error !== null && "message" in error;
};
