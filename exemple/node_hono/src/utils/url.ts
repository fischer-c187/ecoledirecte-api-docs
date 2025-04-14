import { ECOLEDIRECTE_URL } from "../config/constants";

export function getEndpointUrl(
  endpoint: keyof typeof ECOLEDIRECTE_URL,
  params: Record<string, string | number> = {},
  verbe: "get" | "post" | undefined = undefined,
  queryParams: Record<string, string | number> = {}
): string {
  let url = ECOLEDIRECTE_URL[endpoint];

  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value.toString());
  });

  const query = new URLSearchParams();

  if (verbe) {
    query.set("verbe", verbe);
  }

  Object.entries(queryParams).forEach(([key, value]) => {
    query.set(key, value.toString());
  });

  const queryString = query.toString();

  return `${ECOLEDIRECTE_URL.baseUrl}${url}${
    queryString ? `?${queryString}` : ""
  }`;
}
