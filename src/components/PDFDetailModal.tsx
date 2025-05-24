/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Modal } from "@mantine/core";
import {
  IconUser,
  IconCalendar,
  IconMusic,
  IconDownload,
  IconX,
  IconEdit,
} from "@tabler/icons-react";
import UpdateForm from "./UpdateForm";
import { useMediaQuery } from "@mantine/hooks";
import { FileType } from "./Home";

interface PDFDetailModalProps {
  pdf: FileType;
  opened: boolean;
  close: () => void;
  onClickDownload: () => void;
}

const PDFDetailModal = ({ pdf, opened, close, onClickDownload }: PDFDetailModalProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toTitleCase = (str: string) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      size="lg"
      padding={isMobile ? "xs" : "xl"}
      centered
      withCloseButton={false}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 justify-between w-full items-center ">
          <h2 className="sm:text-lg md:text-2xl font-bold text-gray-900">
            {toTitleCase(pdf.title)}
          </h2>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-full p-2 hover:bg-orange-100 hover:scale-105 transition-all duration-300 ease-in-out"
              >
                <IconEdit size={20} className="text-orange-500" />
              </button>
            )}
            <button
              onClick={close}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IconX
                size={20}
                className="text-gray-500 hover:scale-105 transition-all duration-300 ease-in-out"
              />
            </button>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          {isEditing ? (
            <UpdateForm
              pdf={pdf}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex md:items-center flex-col md:flex-row md:flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-orange-100 rounded-full">
                      <IconUser size={12} className="text-orange-600" />
                    </div>
                    <p className="text-sm">Composer: </p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {pdf.composer}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-orange-100 rounded-full">
                      <IconCalendar size={12} className="text-orange-600" />
                    </div>
                    <p className="text-sm">Year Composed: </p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {pdf.year || "No date available"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-orange-100 rounded-full">
                      <IconMusic size={12} className="text-orange-600" />
                    </div>
                    <p className="text-sm">Categories: </p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {pdf.categories.length > 0
                      ? pdf.categories
                          .map((category) => category.name)
                          .join(", ")
                      : "No categories available"}
                  </span>
                </div>
              </div>
              {/* Main Content */}
              <div className="space-y-4">
                <div className="bg-orange-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Lyrics
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {pdf.lyrics}
                  </p>
                </div>
              </div>

              {/* Footer Action */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={onClickDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-100 
                       text-orange-600 font-medium rounded-lg hover:bg-orange-200 
                       active:scale-95 transition-all duration-300"
                >
                  <IconDownload size={18} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PDFDetailModal;
