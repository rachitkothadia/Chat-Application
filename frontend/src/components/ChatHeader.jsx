import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const DEFAULT_PROFILE_PIC =
  "https://res.cloudinary.com/dzlsiekwa/image/upload/v1736102383/lol_crop2_tfvbgh.png";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300 bg-[rgba(0,0,0,0.15)] border-opacity-60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative border border-base-300 border-opacity-80">
              <img
                src={selectedUser.profilePic || DEFAULT_PROFILE_PIC}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)} className="hover:text-red-500">
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
