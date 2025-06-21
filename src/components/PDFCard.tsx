/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Card, Text, Group, Button, Tooltip } from "@mantine/core";
import { IconDownload, IconCalendar, IconUser } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import PDFDetailModal from "./PDFDetailModal";
import { FileType } from "./Home";

const PDFCard = ({ pdf }: { pdf: FileType }) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const [opened, { open, close }] = useDisclosure(false);

  const isNew = () => {
    const uploadDate = new Date(pdf.uploaded_at);
    const now = new Date();
    const timeDiff = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60); // what does this do? it converts to hours
    return timeDiff <= 12;
  };

  interface DownloadEvent extends React.MouseEvent<HTMLButtonElement> {
    stopPropagation: () => void;
  }

  interface PDFBlob extends Blob {
    type: string;
  }

  const handleDownload = async (e: DownloadEvent): Promise<void> => {
    e.stopPropagation();

    try {
      const response: Response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/download/${pdf.id}/download`
      );
      const blob: PDFBlob = (await response.blob()) as PDFBlob;
      const url: string = window.URL.createObjectURL(blob);
      const a: HTMLAnchorElement = document.createElement("a");
      a.href = url;
      a.download = `${pdf?.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error("Error downloading PDF:", error);
    }
  };

  function toTitleCase(text: string) {
    return text.replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement;
    if (!target.closest("button")) {
      open();
    }
  };

  return (
    <>
      <div
        className={`${
          isHovered ? "max-h-none" : "max-h-44"
        } cursor-pointer w-full max-w-md bg-gradient-to-br from-orange-100 to-orange-50  
                border border-orange-200 rounded-xl p-6
                shadow-md hover:shadow-xl transform hover:-translate-y-1
                transition-all duration-300 ease-in-out`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
      >
        {isNew() && (
          <div className="absolute -top-2 -left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-md">
            New
          </div>
        )}

        <div className="h-full flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <h3
                className="text-lg font-semibold text-gray-900
                     tracking-tight leading-tight hover:text-orange-600
                      transition-colors"
              >
                {toTitleCase(pdf.title)}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-orange-100 rounded-full">
                  <IconUser size={14} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {pdf.composer}
                </span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="p-2.5 bg-white border-2 border-orange-500
                 rounded-lg hover:bg-orange-200
                 active:scale-95 transition-all duration-300"
              title="Download PDF"
            >
              <IconDownload size={18} className="text-orange-600" />
            </button>
          </div>
          <p
            className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 cursor-text ${
              isHovered ? "" : "line-clamp-2"
            }`}
          >
            {pdf.lyrics}
          </p>
        </div>
      </div>
      <PDFDetailModal
        opened={opened}
        close={close}
        pdf={pdf}
        onClickDownload={() =>
          handleDownload({ stopPropagation: () => {} } as DownloadEvent)
        }
      />
    </>
  );
};

export default PDFCard;
