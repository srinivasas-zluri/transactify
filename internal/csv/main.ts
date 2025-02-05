import { CSVParsedInfo, CSVWriter } from "./types";
import { handleRow } from "./parse";
import { CSVParseService } from "./csvparser";

export { handleRow };

export async function parseCSV(
  filePath: string,
  {
    seperator = ",",
    errorFileWriter = defaultWriter,
  }: { seperator?: string; errorFileWriter?: CSVWriter } = {}
): Promise<CSVParsedInfo> {
  const csvService = new CSVParseService(filePath, seperator, errorFileWriter);
  return await csvService.parse();
}

const defaultWriter: CSVWriter = {
  writeRows: async () => null,
};
