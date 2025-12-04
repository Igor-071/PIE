"use client";

interface DownloadResultsProps {
  jobId: string;
  markdownFilename: string;
}

export default function DownloadResults({
  jobId,
  markdownFilename,
}: DownloadResultsProps) {
  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/download?jobId=${jobId}&file=${filename}`);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-semibold text-[#161010]">
        PRD Generated Successfully!
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => downloadFile("prd-structured.json")}
          className="flex flex-col items-center justify-center p-6 border-2 border-[#E7E1E2] rounded-lg hover:border-[#F24B57] hover:bg-[#F24B57]/5 transition-all duration-200 bg-white"
        >
          <svg
            className="w-10 h-10 text-[#F24B57] mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-semibold text-[#161010]">
            JSON PRD
          </span>
          <span className="text-xs text-[#161010] opacity-70 mt-1">Structured data</span>
        </button>

        <button
          onClick={() => downloadFile(markdownFilename)}
          className="flex flex-col items-center justify-center p-6 border-2 border-[#E7E1E2] rounded-lg hover:border-[#F24B57] hover:bg-[#F24B57]/5 transition-all duration-200 bg-white"
        >
          <svg
            className="w-10 h-10 text-[#F24B57] mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-semibold text-[#161010]">
            Markdown PRD
          </span>
          <span className="text-xs text-[#161010] opacity-70 mt-1">Readable document</span>
        </button>

        <button
          onClick={() => downloadFile("questions-for-client.json")}
          className="flex flex-col items-center justify-center p-6 border-2 border-[#E7E1E2] rounded-lg hover:border-[#F24B57] hover:bg-[#F24B57]/5 transition-all duration-200 bg-white"
        >
          <svg
            className="w-10 h-10 text-[#F24B57] mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-semibold text-[#161010]">
            Questions
          </span>
          <span className="text-xs text-[#161010] opacity-70 mt-1">Follow-up items</span>
        </button>
      </div>
    </div>
  );
}
