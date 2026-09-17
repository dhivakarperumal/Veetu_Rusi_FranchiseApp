import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://veeturusi.qtechx.com/api";
// const BASE_URL = "http://192.168.1.3:5000/api";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  user?: any;
  message?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers?.get?.("content-type") || "";
  let data: any = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { message: text || "Unexpected response from server." };
      }
    }
  } catch (error) {
    const fallbackMessage =
      "Unexpected response from server. Please check the server status or contact support.";
    const parsedError: any = new Error(fallbackMessage);
    parsedError.response = {
      status: response.status,
      data: { message: fallbackMessage },
    };
    parsedError.status = response.status;
    throw parsedError;
  }

  if (!response.ok) {
    const error: any = new Error(data?.message || "Request Failed");
    error.response = { status: response.status, data };
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function login(payload: LoginPayload) {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data.token) {
    await AsyncStorage.setItem("token", data.token);
  }

  if (data.user) {
    await AsyncStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );
  }

  return data;
}

export async function logout() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, {
    method: "GET",
  });
}

export async function post<T = any>(
  path: string,
  payload: any
): Promise<T> {
  const isFormData = payload instanceof FormData;
  return request<T>(path, {
    method: "POST",
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function put<T = any>(
  path: string,
  payload: any
): Promise<T> {
  const isFormData = payload instanceof FormData;
  return request<T>(path, {
    method: "PUT",
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function del<T = any>(path: string): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
  });
}

export async function patch<T = any>(
  path: string,
  payload: any
): Promise<T> {
  const isFormData = payload instanceof FormData;
  return request<T>(path, {
    method: "PATCH",
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export const getSubscriptionPlans = async () => {
  return get<any[]>("/subscriptions/plans");
};