import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://veeturusi.qtechx.com/api";

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
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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