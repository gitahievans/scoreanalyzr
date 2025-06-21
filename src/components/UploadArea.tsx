"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { IconFileText, IconUpload, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Button } from "@/components/ui/button";

interface UploadResponse {
  status: string;
  score_id: number;
  task_id: string;
  message: string;
}

interface FormData {
  pdf_file: File | null;
}

interface UploadAreaProps {
  onUploadSuccess: (scoreId: number, taskId: string) => void;
  isProcessing: boolean;
}

const uploadScore = async (formData: FormData): Promise<UploadResponse> => {
  const payload = new FormData();
  if (formData.pdf_file) {
    payload.append("pdf_file", formData.pdf_file);
    payload.append("title", formData.pdf_file.name || "Untitled Score");
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

export default function UploadArea({
  onUploadSuccess,
  isProcessing,
}: UploadAreaProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
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
      const validFiles = droppedFiles.filter(validateFile);
      if (validFiles.length > 0) {
        setFiles([validFiles[0]]);
      }
    },
    [isProcessing]
  );

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isProcessing && files[0]) upload({ pdf_file: files[0] });
        }}
      >
        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload PDF Music Score
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
            input.accept = ".pdf";
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files) handleDrop(Array.from(target.files));
            };
            input.click();
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            {files.length ? (
              <IconFileText size={52} className="text-orange-500" />
            ) : (
              <IconUpload size={52} className="text-gray-400" />
            )}
            <div className="text-center">
              <p className="text-xl">
                {files.length
                  ? `${files.length} file selected`
                  : "Drag a PDF file here or click to select"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Maximum file size: 5MB
              </p>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        </div>
        {files.length > 0 && (
          <div className="space-y-4 mt-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-orange-50 rounded-md overflow-hidden border border-orange-200"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-2">
                    <IconFileText size={24} className="text-orange-500" />
                    <span className="text-sm text-gray-600">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles([]);
                      setError(null);
                    }}
                    disabled={isProcessing}
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
