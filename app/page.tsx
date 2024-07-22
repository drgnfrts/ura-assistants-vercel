"use client";
import { Button } from "@/app/components/button";
import { Icons } from "@/app/components/icons";
import { Input } from "@/app/components/input";
// import { readDataStream } from "@/lib/read-data-stream";
import { Message } from "ai/react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import InputBox from "@/app/components/input-box";
import { AI, UIState, getUIStateFromAIState } from "@/app/lib/actions";

const roleToColorMap: Record<Message["role"], string> = {
  system: "lightred",
  user: "white",
  function: "lightblue",
  assistant: "lightgreen",
};

const DotAnimation = () => {
  const dotVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  // Stagger children animations
  const containerVariants = {
    initial: { transition: { staggerChildren: 0 } },
    animate: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
    exit: { transition: { staggerChildren: 0.5, staggerDirection: 1 } },
  };

  const [key, setKey] = useState(0);

  // ...
  return (
    <motion.div
      key={key}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex gap-x-0.5 -ml-1"
      variants={containerVariants}
      onAnimationComplete={() => setKey((prevKey) => prevKey + 1)}
    >
      {[...Array(3)].map((_, i) => (
        <motion.span key={i} variants={dotVariants}>
          .
        </motion.span>
      ))}
    </motion.div>
  );
};

export default function Chat() {
  // const prompt = "Ask GPT your questions - remember to upload your .csv";
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [message, setMessage] = useState<string>(prompt);
  // const [file, setFile] = useState<File | undefined>(undefined);
  // const [threadId, setThreadId] = useState<string>("");
  const [error, setError] = useState<unknown | undefined>(undefined);
  // const [status, setStatus] = useState<AssistantStatus>("awaiting_message");
  // const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="flex flex-col w-full max-w-xl mx-auto stretch">
        <h1 className="text-3xl text-zinc-100 font-extrabold pb-4">
          Feedback Analytics Assistant
        </h1>
        {error != null && (
          <div className="relative bg-red-500 text-white px-6 py-4 rounded-md">
            <span className="block sm:inline">
              Error: {(error as any).toString()}
            </span>
          </div>
        )}

        {/* {messages.map((m: Message) => (
            <div
              key={m.id}
              className="whitespace-pre-wrap"
              style={{ color: roleToColorMap[m.role] }}
            >
              <strong>{`${m.role}: `}</strong>
              <ReactMarkdown>{m.content}</ReactMarkdown>
              <br />
              <br />
            </div>
          ))}

          {status === "in_progress" && (
            <span className="text-white flex gap-x-2">
              <Icons.spinner className="animate-spin w-5 h-5" />
              Reading
              <DotAnimation />
            </span>
          )} */}
        <InputBox />
      </div>
    </main>
    // </AI>
  );
}

// export default Chat;
