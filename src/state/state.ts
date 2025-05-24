import { FileType } from "@/components/Home";
import { proxy } from "valtio";

export const globalState = proxy({
  files: [] as FileType[],
  updateFile: (updatedPDF: FileType) => {
    const fileIndex = globalState.files.findIndex((file: FileType) => file.id === updatedPDF.id);
    if (fileIndex !== -1) {
      globalState.files[fileIndex] = updatedPDF;
    }
  },
});
