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
  const token = await AsyncStorage.getItem("token");

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
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

export async function logout() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
}


export async function get(path: string) {
  return request(path, {
    method: "GET",
  });
}

export async function post(
  path: string,
  payload: any
) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function put(
  path: string,
  payload: any
) {
  return request(path, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function del(path: string) {
  return request(path, {
    method: "DELETE",
  });
}

