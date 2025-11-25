import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    // Thêm 'pointer-events-none' để chuột click xuyên qua lớp div này
    <div className="p-3 border-b flex items-center justify-end max-w-7xl mx-auto w-full absolute top-2 -translate-y-1/3 z-10 pointer-events-none">
      {/* Thêm 'pointer-events-auto' để nút bấm vẫn nhận được click */}
      <button onClick={handleVideoCall} className="btn btn-success btn-sm text-white pointer-events-auto">
        <VideoIcon className="size-4" />
      </button>
    </div>
  );
}

export default CallButton;