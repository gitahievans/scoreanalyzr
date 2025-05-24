/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { MultiSelect } from "@mantine/core";
import { IconCheck, IconPlus, IconX } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { Category, FileType } from "./Home";

interface UpdateFormProps {
  pdf: FileType;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

interface UpdatedPDFResponse {
  id: number;
  title: string;
  composer: string;
  year: string;
  lyrics: string;
  categories: { name: string }[];
}

interface FormDataPayload {
  title: string;
  composer: string;
  year: string;
  lyrics: string;
  categories: { name: string }[];
}

interface FormFields {
  title: string;
  composer: string;
  year: string;
  lyrics: string;
  categories: string[];
}

interface CategoryUpdateState {
  categories: string[];
  [key: string]: any;
}

const UpdateForm = ({ pdf, isEditing, setIsEditing }: UpdateFormProps) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [updatedPDF, setUpdatedPDF] = useState(null);
  const [formData, setFormData] = useState({
    title: pdf.title,
    composer: pdf.composer,
    year: pdf.year,
    lyrics: pdf.lyrics,
    categories: pdf.categories.map((cat) => cat.name),
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "https://nota-db.onrender.com/api/categories/"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        console.log("data", data);

        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    try {
      const response = await fetch(
        `https://nota-db.onrender.com/api/update/${pdf.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            categories: formData.categories.map((name) => ({ name })),
          } as FormDataPayload),
        }
      );

      if (!response.ok) throw new Error("Failed to update PDF");
      const updatedFile: UpdatedPDFResponse = await response.json();

      console.log("res", response);
      notifications.show({
        title: "Success",
        message: "Music Score updated successfully",
        color: "green",
        position: "top-center",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating PDF:", error);
    }
  };

  const handleChange = (field: keyof FormFields) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (categoryName: string): void => {
    setFormData((prev) => {
      const updatedCategories = prev.categories.includes(categoryName)
        ? prev.categories.filter((cat: string) => cat !== categoryName)
        : [...prev.categories, categoryName];
      console.log("updatedCategories", updatedCategories);

      return {
        title: prev.title,
        composer: prev.composer,
        year: prev.year,
        lyrics: prev.lyrics,
        categories: updatedCategories,
      };
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
  ).reverse();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="composer"
          value={formData.title}
          onChange={(e) => handleChange("title")(e.target.value)}
          placeholder="Composer"
          className="w-full p-3 border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Composer
        </label>
        <input
          type="text"
          name="composer"
          value={formData.composer}
          onChange={(e) => handleChange("composer")(e.target.value)}
          placeholder="Composer"
          className="w-full p-3 border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Year
        </label>
        <select
          name="year"
          value={formData.year || ""}
          onChange={(e) => handleChange("year")(e.target.value)}
          className="w-full p-3 bg-white border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Lyrics
        </label>
        <textarea
          name="lyrics"
          value={formData.lyrics}
          onChange={(e) => handleChange("lyrics")(e.target.value)}
          placeholder="Lyrics"
          className="w-full p-3 border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Song Category
        </label>
        <p className="text-xs text-gray-400">Choose from exixting categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category: Category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryChange(category.name)}
              className={`px-3 py-1 rounded-full text-sm 
                          ${
                            formData.categories.includes(category.name)
                              ? "bg-orange-500 text-white"
                              : "bg-orange-100 text-orange-700"
                          }
                          hover:bg-orange-400 hover:text-white transition-colors`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {showNewCategoryInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter new category"
            className="flex-1 p-2 border rounded-md border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleNewCategorySubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Add
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            Add a New Category for the Song
          </p>

          <button
            type="button"
            onClick={() => setShowNewCategoryInput(true)}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <IconPlus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
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
                <button
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className="text-orange-500 hover:text-orange-700"
                >
                  <IconX size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-orange-100 
                           text-orange-600 font-medium rounded-lg hover:bg-orange-200
                           active:scale-95 transition-all duration-300"
        >
          <IconCheck size={18} />
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default UpdateForm;
