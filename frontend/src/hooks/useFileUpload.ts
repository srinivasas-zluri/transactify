import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { routes } from "@/const";
import { triggerDownloadBlob } from "@/utils/downloadBlob";

export const useFileUpload = () => {
  const [progress, setProgress] = useState<number>(0);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(routes.transactions.upload, formData, {
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
      if (res.status == 201) {
        toast.success("File uploaded successfully!");
      } else if (res.status == 200) {
        console.log(res);
        toast.warning(
          "File failed to upload one (or) more transactions, check the file for more details"
        );
        triggerDownloadBlob(res.data, "errors.csv");
      }
    } catch (error) {
      toast.error("File upload failed");
      console.error(error);
    }
  };

  return {
    progress,
    handleFileUpload,
  };
};
