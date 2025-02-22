import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsFetching(true);
      await getMessages(selectedUser._id);
      setIsFetching(false);
    };

    fetchMessages();
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const checkWarning = async () => {
      try {
        const res = await fetch(`/api/user/warning-status/${authUser._id}`);
        const data = await res.json();
        setShowWarning(data.showWarning);
      } catch (err) {
        console.error("Error fetching warning status:", err);
      }
    };

    checkWarning();
  }, [authUser._id]);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {showWarning && (
        <div className="bg-yellow-500 text-white text-center p-2">
          ⚠️ If you send another inappropriate message, you will be banned.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isFetching ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-sm text-gray-500">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={selectedUser.profilePic || "https://res.cloudinary.com/dzlsiekwa/image/upload/v1736102383/lol_crop2_tfvbgh.png"}
                    onError={(e) => (e.target.src = "https://res.cloudinary.com/dzlsiekwa/image/upload/v1736102383/lol_crop2_tfvbgh.png")}
                    alt={selectedUser.fullName || "Default Profile Picture"}
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
