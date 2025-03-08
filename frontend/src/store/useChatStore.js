import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "axios"; // Import axios for ML API calls
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  unreadMessages: {}, // ✅ Fixed: Now properly managed
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // ✅ Mark messages as read when fetching messages
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { logout, authUser } = useAuthStore.getState();

    if (!authUser || !authUser._id) {
      console.error("❌ ERROR: authUser is missing or invalid!", authUser);
      toast.error("Authentication error. Please log in again.");
      if (typeof logout === "function") {
        await logout();
        console.log("✅ Logout completed due to missing authUser.");
      } else {
        console.error("❌ Logout function is not available!");
      }
      return;
    }

    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected or invalid recipient!");
      return;
    }

    // ✅ Allow sending only images, even if text is empty
    const hasText = messageData.text && messageData.text.trim().length > 0;
    const hasImage = messageData.imageUrl && messageData.imageUrl.trim().length > 0;

    if (!hasText && !hasImage) {
      toast.error("Message cannot be empty!");
      return;
    }

    // ✅ If only an image is sent, bypass ML check
    if (hasImage && !hasText) {
      console.log("🖼️ Only image detected, bypassing ML check...");
    } else if (hasText) {
      try {
        console.log("🔍 Sending text for harmful content check...");
        const checkResponse = await axios.post(
          "http://127.0.0.1:5002/predict",
          { message: messageData.text.trim() },
          { headers: { "Content-Type": "application/json" } }
        );

        console.log("✅ ML API Response:", checkResponse.data);

        if (!checkResponse.data || checkResponse.data.prediction === undefined) {
          console.error("🚨 ERROR: Invalid API response!", checkResponse);
          toast.error("Error verifying message content. Try again.");
          return;
        }

        if (checkResponse.data.prediction === 1) {
          console.warn("⚠️ Harmful message detected!");
          toast.error("⚠️ Message contains harmful content! You have been suspended.");

          try {
            console.log("🔄 Updating user suspension...");
            await axiosInstance.put(`/auth/suspend/${authUser._id}`, { banned: true });
          } catch (err) {
            console.error("❌ Failed to suspend user:", err.response?.data || err);
            toast.error("Suspension failed. Contact support.");
            return;
          }

          if (typeof logout === "function") {
            await logout();
            console.log("✅ Logout function executed!");
          } else {
            console.error("❌ Logout function is not defined!");
          }
          return;
        }
      } catch (error) {
        console.error("❌ Error during harmful message check:", error);
        toast.error("Error checking message safety. Please try again.");
        return;
      }
    }

    // ✅ Send the message after passing checks
    console.log("✅ Message is safe, sending...");
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      console.log("✅ Message sent:", res.data);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message. Try again.");
    }
  },

  subscribeToMessages: () => {
    // eslint-disable-next-line no-unused-vars
    const { selectedUser, unreadMessages } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.error("Socket is not initialized. Skipping subscription.");
      return;
    }

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;

      if (isMessageSentFromSelectedUser) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      } else {
        const senderId = newMessage.senderId;
        set((state) => ({
          unreadMessages: {
            ...state.unreadMessages,
            [senderId]: (state.unreadMessages[senderId] || 0) + 1,
          },
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser && selectedUser._id) {
      get().markMessagesAsRead(selectedUser._id);
    }
  },

  markMessagesAsRead: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0,
      },
    }));
  },

  // ✅ Added function to clear unread messages
  clearUnreadMessages: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0,
      },
    }));
  },
}));
