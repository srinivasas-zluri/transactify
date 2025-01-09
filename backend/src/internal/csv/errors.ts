export type CSVParseError =
  | { type: "FileNotFound"; filePath: string }
  | { type: "InvalidFormat"; message: string }
  | { type: "InvalidLine"; lineNo: number; message: string }
  | { type: "ParsingError"; message: string }
  | { type: "UnknownError"; message: string };
