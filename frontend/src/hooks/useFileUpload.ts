import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { routes } from "@/const";

export const useFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      await axios.post(routes.transactions.upload, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (
            !progressEvent.lengthComputable ||
            progressEvent.total === undefined
          )
            return;
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setProgress(progress);
        },
      });
      toast.success("File uploaded successfully!");
      setFile(null);
    } catch (error) {
      toast.error("File upload failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    file,
    setFile,
    loading,
    progress,
    handleFileUpload,
  };
};
