export const triggerDownloadBlob = (csvData: string, csvFileName: string) => {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download == undefined) {
    return;
  }
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", csvFileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
