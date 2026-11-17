/* eslint-disable @typescript-eslint/no-explicit-any */
// Where the backend is. Also for plain <img> links to public files
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class StpApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async request(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    endpoint: string,
    body?: any,
    customHeaders: Record<string, string> = {},
  ) {
    const isFormData = body instanceof FormData;

    const headers: Record<string, string> = {
      ...customHeaders,
    };

    // Only set Content-Type for non-FormData requests
    // For FormData, the browser sets it automatically with the boundary
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body && method !== "GET") {
      // Don't stringify FormData
      options.body = isFormData ? body : JSON.stringify(body);
    }

    // Network errors (server down, CORS) come back as a generic TypeError
    const res = await fetch(`${this.baseUrl}${endpoint}`, options).catch(() => {
      throw new Error("No se pudo conectar con el servidor");
    });

    // Better Auth's rate limit (back/src/auth.ts), e.g. too many login attempts
    if (res.status === 429) {
      throw new Error("Demasiados intentos seguidos. Espera un minuto y vuelve a probar.");
    }

    await this.throwIfFailed(res);

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  private async throwIfFailed(res: Response) {
    if (res.ok) return;
    const errorData = await res.json().catch(() => ({}));
    // Our API sends { error: { code, message } }, Better Auth sends { message }
    const message =
      errorData?.error?.message ??
      (typeof errorData?.error === "string" ? errorData.error : undefined) ??
      errorData?.message;
    // `code` lets a page react to one specific error (e.g. "SLOT_TAKEN")
    throw Object.assign(new Error(message || "Error en la solicitud"), {
      code: typeof errorData?.error?.code === "string" ? errorData.error.code : undefined,
    });
  }

  // Sends a file as the request body (with its own type), and details about it
  // in the URL. Returns the JSON answer
  async upload(
    endpoint: string,
    file: Blob,
    params: Record<string, string> = {},
    method: "POST" | "PUT" = "POST",
  ) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${this.baseUrl}${endpoint}${query ? `?${query}` : ""}`, {
      method,
      headers: { "Content-Type": file.type },
      credentials: "include",
      body: file,
    }).catch(() => {
      throw new Error("No se pudo conectar con el servidor");
    });
    await this.throwIfFailed(res);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // Fetches a file (with the session cookie, so a plain link wouldn't do)
  async download(endpoint: string): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, { credentials: "include" }).catch(() => {
      throw new Error("No se pudo conectar con el servidor");
    });
    await this.throwIfFailed(res);
    return res.blob();
  }

  get(
    endpoint: string,
    options: {
      params?: Record<string, any>;
      headers?: Record<string, string>;
    } = {},
  ) {
    const { params = {}, headers = {} } = options;

    const query = new URLSearchParams(params).toString();
    const urlWithParams = query ? `${endpoint}?${query}` : endpoint;

    return this.request("GET", urlWithParams, null, headers);
  }

  post(endpoint: string, body: any, headers = {}) {
    return this.request("POST", endpoint, body, headers);
  }

  put(endpoint: string, body: any, headers = {}) {
    return this.request("PUT", endpoint, body, headers);
  }

  patch(endpoint: string, body: any, headers = {}) {
    return this.request("PATCH", endpoint, body, headers);
  }

  delete(endpoint: string, body: any = null, headers = {}) {
    return this.request("DELETE", endpoint, body, headers);
  }
}

// ✅ export an instance, NOT the class
const stpApi = new StpApi();
export default stpApi;
