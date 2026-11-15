/**
 * Saves text as a file in the browser by clicking a temporary object-URL link.
 * A side effect: call it from controllers (src/features/**), not from components.
 */
export function downloadFile(fileName: string, fileContents: string, mimeType: string) {
  const downloadLink = document.createElement("a");
  const objectUrl = URL.createObjectURL(new Blob([fileContents], { type: mimeType }));
  downloadLink.href = objectUrl;
  downloadLink.download = fileName;
  downloadLink.click();
  URL.revokeObjectURL(objectUrl);
}
