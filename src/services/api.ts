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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request Failed");
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