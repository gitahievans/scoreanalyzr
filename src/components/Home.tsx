'use client'

/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import PDFCard from "./PDFCard";
import { IconSearch } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { useSnapshot } from "valtio";
import { globalState } from "../state/state";

export interface Category {
  id: number;
  name: string;
}
export interface FileType {
  id: number;
  title: string;
  lyrics?: string;
  uploaded_at: string;
  composer: string;
  categories: Category[];
  year: string;
}
const Home = () => {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileType[]>([]);
  const [sortBy, setSortBy] = useState("title-asc");
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/files/");
        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }
        const data = await response.json();
        setFiles(data);
        setFilteredFiles(data);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching PDFs:", error);
        setError(error.message);
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  console.log("files", files);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.currentTarget.value.toLowerCase();
    setSearchTerm(term);

    const filtered = files.filter(
      (file) =>
        file.title.toLowerCase().includes(term) ||
        (file.lyrics && file.lyrics.toLowerCase().includes(term))
    );
    setFilteredFiles(filtered);
  };

  const handleSort = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sortValue = event.target.value;
    setSortBy(sortValue);

    const sortedFiles = [...filteredFiles].sort((a, b) => {
      switch (sortValue) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-asc":
          return (
            new Date(a.uploaded_at).getTime() -
            new Date(b.uploaded_at).getTime()
          );
        case "date-desc":
          return (
            new Date(b.uploaded_at).getTime() -
            new Date(a.uploaded_at).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredFiles(sortedFiles);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (files.length > 0) {
        const filtered = files.filter(
          (file) =>
            file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (file.lyrics &&
              file.lyrics.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredFiles(filtered);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, files]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-red-500 text-xl mb-4">Error loading PDFs</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <IconSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={isMobile ? 16 : 20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search Scores..."
              className="placeholder:text-gray-400 placeholder:text-xs pl-10 py-1.5 md:py-2 bg-orange-50 rounded-lg w-full border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={handleSort}
            className="py-2 px-4 bg-orange-50 rounded-lg text-sm border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
          >
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="date-desc">Date (Newest)</option>
          </select>
        </div>
        {filteredFiles.length === 0 && searchTerm && (
          <p className="text-gray-500 mt-4">
            No PDFs found matching your search.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file: FileType) => (
          <PDFCard key={file.id} pdf={file} />
        ))}
      </div>
    </div>
  );
};

export default Home;
