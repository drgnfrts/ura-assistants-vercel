import FileHandler from "./file-upload";
import MessageForm from "./message-upload";

export default function InputBox() {
  return (
    <div className="flex flex-col items-start flex-col p-4 pb-2 text-white max-w-xl bg-black mx-auto fixed bottom-0 w-full mb-8 border border-gray-300 rounded-xl shadow-xl">
      <MessageForm />
      <FileHandler />
    </div>
  );
}
