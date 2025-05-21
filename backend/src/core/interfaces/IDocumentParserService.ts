export interface IDocumentParserService {
  parse(filePath: string, mimeType: string): Promise<string>;
}
