"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { IconFileText, IconUpload, IconX, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Alert } from "@mantine/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Category {
  id: number;
  name: string;
}

interface FormDataType {
  title: string;
  composer: string;
  lyrics: string;
  file: File | null;
  categories: string[];
  year: number | null;
}

interface UploadResponse {
  status: string;
  score_id: number;
  task_id: string | null;
  message: string;
}

const uploadScore = async (formData: FormDataType): Promise<UploadResponse> => {
  const payload = new FormData();
  payload.append("title", formData.title);
  payload.append("composer", formData.composer || "Anonymous");
  payload.append("lyrics", formData.lyrics);
  if (formData.file) {
    payload.append("pdf_file", formData.file);
  }
  if (formData.year) {
    payload.append("year", formData.year.toString());
  }
  payload.append(
    "categories",
    JSON.stringify(formData.categories.map((name) => ({ name })))
  );
  payload.append("analyze", "false");

  const response = await fetch("http://127.0.0.1:8000/api/upload/", {
    method: "POST",
    body: payload,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload file");
  }
  return response.json();
};

export default function PDFUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    composer: "",
    lyrics: "",
    file: null,
    categories: [],
    year: null,
  });
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "https://nota-db.onrender.com/api/categories/"
        );
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const {
    mutate: upload,
    isPending: uploading,
    error,
  } = useMutation({
    mutationFn: uploadScore,
    onSuccess: (data: UploadResponse) => {
      notifications.show({
        title: "Success",
        message: data.message || "File uploaded successfully",
        color: "green",
        icon: <IconUpload />,
        position: "top-center",
      });
      setFormData({
        title: "",
        composer: "",
        lyrics: "",
        file: null,
        categories: [],
        year: null,
      });
      setFiles([]);
      router.push("/library");
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
        icon: <IconX />,
        position: "top-center",
      });
    },
  });

  const handleFileChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? (value ? Number(value) : null) : value,
    }));
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf"
    );
    if (pdfFiles.length !== acceptedFiles.length) {
      notifications.show({
        title: "Error",
        message: "Only PDF files can be uploaded.",
        color: "red",
        icon: <IconX />,
      });
      return;
    }
    setFiles([pdfFiles[0]]);
    setFormData((prev) => ({ ...prev, file: pdfFiles[0] }));
  };

  const handleCategoryChange = (categoryName: string) => {
    setFormData((prev) => {
      const updatedCategories = prev.categories.includes(categoryName)
        ? prev.categories.filter((cat) => cat !== categoryName)
        : [...prev.categories, categoryName];
      return { ...prev, categories: updatedCategories };
    });
  };

  const handleNewCategorySubmit = () => {
    if (newCategory.trim()) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory("");
      setShowNewCategoryInput(false);
    }
  };

  const years = Array.from(
    { length: new Date().getFullYear() - 1900 + 1 },
    (_, index) => 1900 + index
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-orange-600 mb-2">
          Upload New Music Score
        </h1>
        <h4 className="text-gray-600">Add a new score to the library</h4>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (formData.file && formData.title.trim()) upload(formData);
        }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleFileChange}
            placeholder="Title"
            required
          />
          <Label htmlFor="composer">Composer</Label>
          <Input
            name="composer"
            value={formData.composer}
            onChange={handleFileChange}
            placeholder="Composer"
          />
          <Label htmlFor="year">Year Composed</Label>
          <select
            name="year"
            value={formData.year?.toString() || ""}
            onChange={handleFileChange}
            className="w-full p-3 bg-white border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">Select Year</option>
            {years.reverse().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Label htmlFor="lyrics">Lyrics</Label>
          <textarea
            name="lyrics"
            value={formData.lyrics}
            onChange={handleFileChange}
            placeholder="Lyrics?"
            rows={3}
            className="w-full p-3 border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <div
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer
              ${
                files.length
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300"
              }
              ${error ? "border-red-500 bg-red-50" : ""}
              hover:border-orange-500 transition-colors`}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(Array.from(e.dataTransfer.files));
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/pdf";
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
              </div>
            </div>
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-md"
                >
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles([]);
                      setFormData((prev) => ({ ...prev, file: null }));
                    }}
                  >
                    <IconX size={20} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category: Category) => (
              <Button
                key={category.id}
                type="button"
                variant={
                  formData.categories.includes(category.name)
                    ? "default"
                    : "outline"
                }
                onClick={() => handleCategoryChange(category.name)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          {showNewCategoryInput ? (
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category"
              />
              <Button type="button" onClick={handleNewCategorySubmit}>
                Add
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="link"
              onClick={() => setShowNewCategoryInput(true)}
              className="flex items-center gap-2 text-orange-600"
            >
              <IconPlus size={16} /> Add New Category
            </Button>
          )}
          {formData.categories.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Selected categories:</p>
              <div className="flex flex-wrap gap-2">
                {formData.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  >
                    {cat}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryChange(cat)}
                    >
                      <IconX size={14} />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            disabled={uploading || !formData.file || !formData.title.trim()}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <IconUpload size={20} className="mr-2" /> Upload
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
