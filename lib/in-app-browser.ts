/** Instagram / Facebook / WhatsApp in-app browsers block UPI deep links. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /Instagram/i.test(ua) ||
    /FBAN|FBAV|FB_IAB/i.test(ua) ||
    /WhatsApp/i.test(ua) ||
    /Line\//i.test(ua) ||
    /Twitter/i.test(ua)
  );
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}
