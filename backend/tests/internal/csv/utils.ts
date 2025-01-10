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

export const createCSVWithBOM = (fileName: string, content: string) => {
  const bom = Buffer.from([0xef, 0xbb, 0xbf]); // BOM for UTF-8
  const filePath = path.join(tempDir, fileName);
  fs.writeFileSync(filePath, bom);
  fs.appendFileSync(filePath, content);
  return filePath;
};
