export interface GtkData {
  gtk: string;
  cookieString: string;
}

export const extractGtkFromCookie = (setCookie: string): GtkData | null => {
  if (!setCookie) return null;

  const cookieParts = setCookie.split(", ");
  let gtkCookie = null;
  let secondCookie = null;

  for (const part of cookieParts) {
    const cookieMain = part.split(";")[0];

    if (cookieMain.startsWith("GTK=")) {
      gtkCookie = cookieMain;
    } else {
      secondCookie = cookieMain;
    }
  }

  if (!gtkCookie) return null;

  const gtk = gtkCookie.substring(4);
  const cookieString = secondCookie
    ? `${gtkCookie}; ${secondCookie}`
    : gtkCookie;

  return { gtk, cookieString };
};
