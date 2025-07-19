"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  IconFileText,
  IconUpload,
  IconX,
  IconPhoto,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Button } from "@/components/ui/button";

interface UploadResponse {
  status: string;
  score_id: number;
  task_id: string;
  message: string;
}

interface FormData {
  file: File | null;
}

interface UploadAreaProps {
  onUploadSuccess: (scoreId: number, taskId: string) => void;
  isProcessing: boolean;
}

interface FileWithPreview {
  file: File;
  previewUrl?: string;
}

const uploadScore = async (formData: FormData): Promise<UploadResponse> => {
  const payload = new FormData();
  if (formData.file) {
    payload.append("file", formData.file);
    payload.append("title", formData.file.name || "Untitled Score");
    payload.append("composer", "Anonymous");
    payload.append("analyze", "true");
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${API_URL}/api/upload/`, {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload file");
  }
  return response.json();
};

// Supported file types
const SUPPORTED_FILE_TYPES = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/jpg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/bmp": "BMP",
  "image/tiff": "TIFF",
  "image/webp": "WebP",
};

const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
];

export default function UploadArea({
  onUploadSuccess,
  isProcessing,
}: UploadAreaProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Cleanup blob URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      files.forEach((fileWithPreview) => {
        if (fileWithPreview.previewUrl) {
          URL.revokeObjectURL(fileWithPreview.previewUrl);
        }
      });
    };
  }, [files]);

  const { mutate: upload, isPending: isLoading } = useMutation({
    mutationFn: uploadScore,
    onSuccess: (data: UploadResponse) => {
      notifications.show({
        title: "Success",
        message: data.message || "File uploaded successfully",
        color: "green",
        icon: <IconUpload />,
        position: "top-center",
      });
      // Cleanup blob URLs before clearing files
      files.forEach((fileWithPreview) => {
        if (fileWithPreview.previewUrl) {
          URL.revokeObjectURL(fileWithPreview.previewUrl);
        }
      });
      setFiles([]);
      setError(null);
      onUploadSuccess(data.score_id, data.task_id);
    },
    onError: (error: Error) => {
      setError(error.message);
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        icon: <IconX />,
        position: "top-center",
      });
    },
  });

  const isFileTypeSupported = (file: File): boolean => {
    return Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
  };

  const getFileTypeDisplayName = (file: File): string => {
    return (
      SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES] ||
      "Unknown"
    );
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const createFileWithPreview = (file: File): FileWithPreview => {
    const fileWithPreview: FileWithPreview = { file };

    if (isImageFile(file)) {
      fileWithPreview.previewUrl = URL.createObjectURL(file);
    }

    return fileWithPreview;
  };

  const validateFile = (file: File): boolean => {
    if (!isFileTypeSupported(file)) {
      const supportedTypes = Object.values(SUPPORTED_FILE_TYPES).join(", ");
      setError(`Only ${supportedTypes} files are allowed`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit");
      return false;
    }
    return true;
  };

  const handleDrop = useCallback(
    (droppedFiles: File[]) => {
      if (isProcessing) return;
      setError(null);

      // Cleanup previous blob URLs
      files.forEach((fileWithPreview) => {
        if (fileWithPreview.previewUrl) {
          URL.revokeObjectURL(fileWithPreview.previewUrl);
        }
      });

      const validFiles = droppedFiles.filter(validateFile);
      if (validFiles.length > 0) {
        const filesWithPreview = validFiles
          .slice(0, 1)
          .map(createFileWithPreview);
        setFiles(filesWithPreview);
      }
    },
    [isProcessing, files]
  );

  const getFileIcon = (file: File) => {
    return isImageFile(file) ? (
      <IconPhoto size={24} className="text-orange-500" />
    ) : (
      <IconFileText size={24} className="text-orange-500" />
    );
  };

  const getDropzoneIcon = () => {
    if (files.length > 0) {
      return isImageFile(files[0].file) ? (
        <IconPhoto size={52} className="text-orange-500" />
      ) : (
        <IconFileText size={52} className="text-orange-500" />
      );
    }
    return <IconUpload size={52} className="text-gray-400" />;
  };

  const removeFile = () => {
    // Cleanup blob URLs
    files.forEach((fileWithPreview) => {
      if (fileWithPreview.previewUrl) {
        URL.revokeObjectURL(fileWithPreview.previewUrl);
      }
    });
    setFiles([]);
    setError(null);
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isProcessing && files[0]) upload({ file: files[0].file });
        }}
      >
        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload Music Score (PDF or Image)
        </Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 cursor-pointer
            ${
              files.length
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300"
            }
            ${error ? "border-red-500 bg-red-50" : ""}
            ${
              isProcessing
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-orange-500"
            }
            transition-colors`}
          onDrop={(e) => {
            e.preventDefault();
            if (!isProcessing) handleDrop(Array.from(e.dataTransfer.files));
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => {
            if (isProcessing) return;
            const input = document.createElement("input");
            input.type = "file";
            input.accept = SUPPORTED_EXTENSIONS.join(",");
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) handleDrop(Array.from(target.files));
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            {getDropzoneIcon()}
            <div className="text-center">
              <p className="text-xl">
                {files.length
                  ? `${files.length} file selected`
                  : "Drag a PDF or image file here or click to select"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, JPEG, PNG, TIFF
              </p>
              <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        </div>
        {files.length > 0 && (
          <div className="space-y-4 mt-4">
            {files.map((fileWithPreview, index) => (
              <div
                key={index}
                className="bg-orange-50 rounded-md overflow-hidden border border-orange-200"
              >
                <div className="flex items-start justify-between p-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* File info section */}
                    <div className="flex items-center space-x-2">
                      {getFileIcon(fileWithPreview.file)}
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">
                          {fileWithPreview.file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getFileTypeDisplayName(fileWithPreview.file)} •{" "}
                          {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </span>
                      </div>
                    </div>

                    {/* Image preview section */}
                    {fileWithPreview.previewUrl && (
                      <div className="flex-1 max-w-xs">
                        <img
                          src={fileWithPreview.previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-32 object-contain rounded border border-orange-200"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={isProcessing}
                    className="ml-2"
                  >
                    <IconX size={20} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button
          type="submit"
          disabled={isLoading || !files.length || isProcessing}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            "Upload Score"
          )}
        </Button>
      </form>
    </div>
  );
}
