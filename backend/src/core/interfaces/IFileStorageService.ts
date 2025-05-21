export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

export interface IFileStorageService {
  saveFile(
    file: UploadedFile,
    destinationSubFolder: string
  ): Promise<{ filePath: string; fileName: string }>;

  deleteFile(filePath: string): Promise<void>;
}
