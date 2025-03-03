import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "axios";  // Import axios for ML API calls
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { logout } = useAuthStore.getState();  // ✅ Explicitly get logout function
    const { authUser } = useAuthStore.getState();

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

    try {
        // ✅ Step 1: Check if the message is harmful
        const checkResponse = await axios.post("http://127.0.0.1:5002/predict",
            { message: messageData.text },
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("🔍 Harmful check response:", checkResponse.data);

        if (!checkResponse?.data || checkResponse.data.prediction === undefined) {
            console.error("🚨 ERROR: API response is invalid!", checkResponse);
            return;
        }

        console.log("✅ Prediction value:", checkResponse.data.prediction);

        if (checkResponse.data.prediction === 1) {
            console.warn("⚠️ Message detected as harmful! Executing suspension logic...");
            toast.error("⚠️ Message contains harmful content! You have been suspended.");
            console.log("✅ Toast fired!");

            try {
                console.log("🔄 Sending suspend request to:", `/auth/suspend/${authUser._id}`);
                const suspendResponse = await axiosInstance.put(`/auth/suspend/${authUser._id}`, { banned: true });
                console.log("✅ Suspend Response:", suspendResponse.data);
            } catch (err) {
                console.error("❌ Failed to suspend user:", err.response?.data || err);
                toast.error(`Failed to suspend user: ${err.response?.data?.message || "Unknown error"}`);
                return;
            }

            console.log("🚪 Calling logout function...");
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

    // ✅ Step 5: Send Message if Safe (Kept Unchanged)
    console.log("✅ Message is safe, sending...");
    const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
    console.log("✅ Message sent:", res.data);

    set({ messages: [...messages, res.data] });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.error("Socket is not initialized. Skipping subscription.");
      return;
    }

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
