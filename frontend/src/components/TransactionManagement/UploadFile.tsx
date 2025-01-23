import { Toast } from "@/models/toast";
import { useState } from "react";
import { TbCloudUpload } from "react-icons/tb";


interface UploadFileProps {
    onUpload: (file: File) => Promise<void>;
    toast: Toast;
}
export function UploadFile({ onUpload, toast }: UploadFileProps) {

    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files ? e.target.files[0] : null;
        setFile(uploadedFile);
        console.log({ file, uploadedFile });
        if (uploadedFile == null || uploadedFile === undefined) {
            toast.error('No file selected');
            return;
        }

        try {
            await onUpload(uploadedFile);
            setFile(null);
        } catch (error) {
            console.error(error);
            toast.error('File upload failed');
            setFile(null);
        }
    }

    return <div className='w-full'>
        <div className="mb-4">
            <div className="relative flex justify-center items-center w-ful">
                <label className="relative flex flex-col justify-center items-center border-2 border-slate-400 hover:border-gray-400 bg-slate-100/10 hover:bg-slate-100 border-dashed rounded-lg w-full max-w-2xl transition-all cursor-pointer">
                    {
                        (file == null) && <><TbCloudUpload className='p-5 text-slate-800 size-28' />
                            <span className="mt-2 px-5 pb-2 text-slate-600">
                                Click to upload a CSV file with transactions
                            </span>
                            <input
                                type="file"
                                accept='.csv'
                                onChange={async (e) => { await handleUpload(e); }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </>
                    }
                </label>
            </div>
        </div>
    </div>
}
