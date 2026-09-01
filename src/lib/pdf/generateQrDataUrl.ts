import QRCode from "qrcode";

/**
 * Generate a base64 Data URL for a QR code representing the verification URL.
 */
export async function generateQrDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 140,
      margin: 1,
      color: {
        dark: "#1864AB", // DepEd Blue accent
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Failed to generate custom QR code, falling back:", err);
    return await QRCode.toDataURL(url);
  }
}
