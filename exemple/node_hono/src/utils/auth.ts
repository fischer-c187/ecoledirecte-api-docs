import { ECOLEDIRECTE_CONFIG } from "../config/constants";
import { GtkData } from "./cookies";

export const getBaseHeaders = (gtkData?: GtkData, token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": ECOLEDIRECTE_CONFIG.userAgent,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "fr-FR,en-US;q=0.7,en;q=0.3",
    Origin: "https://www.ecoledirecte.com",
    Referer: "https://www.ecoledirecte.com/",
    DNT: "1",
    "Sec-GPC": "1",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
  };

  if (gtkData) {
    headers["Cookie"] = gtkData.cookieString;
    headers["X-GTK"] = gtkData.gtk;
  }

  if (token) {
    headers["X-Token"] = token;
  }

  return headers;
};
