import path from "path";
import fs from "fs";

export const tempDir = path.join(__dirname, "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

export const createCSVFile = (filename: string, content: string) => {
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
};
