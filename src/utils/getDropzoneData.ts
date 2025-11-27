// minimal local type to avoid importing template types
export type CustomFile = {
  name: string;
  size: number;
  path?: string;
  type: string;
  preview?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
};

export default function getDropzoneData(file: CustomFile | string, index?: number) {
  if (typeof file === 'string') {
    return {
      key: index ? `${file}-${index}` : file,
      preview: file
    };
  }

  return {
    key: index ? `${file.name}-${index}` : file.name,
    name: file.name,
    size: file.size,
    path: file.path,
    type: file.type,
    preview: file.preview,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate
  };
}
