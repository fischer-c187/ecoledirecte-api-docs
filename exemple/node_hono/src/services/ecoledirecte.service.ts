import { ECOLEDIRECTE_CONFIG, ECOLEDIRECTE_URL } from "../config/constants";
import {
  DoubleAuthResponse,
  EcoleDirecteResponse,
  LoginCredentials,
  LoginResponseData,
  QcmQuestion,
} from "../types/ecoleDirecte";
import { getBaseHeaders } from "../utils/auth";
import { extractGtkFromCookie, GtkData } from "../utils/cookies";
import { getEndpointUrl } from "../utils/url";

export class EcoleDirecteService {
  private async request<T>(
    endpoint: keyof typeof ECOLEDIRECTE_URL,
    pathParams: Record<string, any> = {},
    method: "get" | "post" | undefined = "get",
    data: Record<string, any> = {},
    token?: string,
    gtkData?: GtkData,
    queryParams?: Record<string, string | number>
  ): Promise<EcoleDirecteResponse<T>> {
    const form = new URLSearchParams();
    form.append("data", JSON.stringify(data));

    const response = await fetch(
      getEndpointUrl(endpoint, pathParams, method, queryParams),
      {
        method: method === "get" ? "POST" : "POST",
        headers: getBaseHeaders(gtkData, token),
        body: form,
      }
    );

    return response.json();
  }

  async getGTK(): Promise<GtkData> {
    const response = await fetch(
      getEndpointUrl("login", {}, undefined, {
        gtk: "1",
        v: ECOLEDIRECTE_CONFIG.apiVersion,
      }),
      {
        method: "GET",
        headers: getBaseHeaders(),
      }
    );

    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) {
      throw new Error("No cookie found in the response");
    }

    const gtkData = extractGtkFromCookie(setCookie);
    if (!gtkData) {
      throw new Error("GTK cookie not found in the response");
    }

    return gtkData;
  }

  async login(
    gtkData: GtkData,
    credentials: LoginCredentials
  ): Promise<EcoleDirecteResponse<LoginResponseData>> {
    // Map new field names to EcoleDirecte API expected names
    const apiCredentials = {
      identifiant: credentials.username,
      motdepasse: credentials.password,
      isReLogin: credentials.isReLogin,
      uuid: credentials.uuid,
      ...(credentials.fa && { fa: credentials.fa }),
    };

    return this.request<LoginResponseData>(
      "login",
      {},
      "post",
      apiCredentials,
      undefined,
      gtkData
    );
  }

  async getQCM(
    gtkData: GtkData,
    token: string
  ): Promise<EcoleDirecteResponse<QcmQuestion>> {
    return this.request<QcmQuestion>(
      "doubleAuth",
      {},
      "get",
      {},
      token,
      gtkData
    );
  }

  // Answer the QCM
  async answerQCM(
    gtkData: GtkData,
    token: string,
    choiceBase64: string
  ): Promise<EcoleDirecteResponse<DoubleAuthResponse>> {
    return this.request<DoubleAuthResponse>(
      "doubleAuth",
      {},
      "post",
      { choix: choiceBase64 },
      token,
      gtkData
    );
  }

  async getAssignmentNotebook(studentId: number, token: string): Promise<any> {
    const result = await this.request<any>(
      "cahierDeTexte",
      { eleveId: studentId },
      "get",
      {},
      token
    );
    return result.data;
  }

  async getAssignmentsByDate(
    studentId: number,
    token: string,
    date: string
  ): Promise<any> {
    const result = await this.request<any>(
      "cahierDeTexteDate",
      { eleveId: studentId, date },
      "get",
      {},
      token
    );
    return result.data;
  }
}
