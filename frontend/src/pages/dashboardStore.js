// stores/dashboardStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import API from "../api/config";

const useDashboardStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // UI State
        activeItem: "todoList",
        isExpanded: false,

        // User Profile State
        userProfile: {
          isPaid: false,
          username: "",
          email: "",
          age: "",
          profession: "",
          photoURL: "",
        },

        // Loading and Error States
        isLoading: true,
        error: null,

        // Actions
        setActiveItem: (item) => set({ activeItem: item }),
        setIsExpanded: (expanded) => set({ isExpanded: expanded }),
        setUserProfile: (profile) => set({ userProfile: profile }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Async Actions
        fetchUserProfile: async (user) => {
          if (!user?.uid) {
            set({
              userProfile: {
                isPaid: false,
                username: "",
                email: "",
                age: "",
                profession: "",
                photoURL: "",
              },
              error: "Please log in to access your dashboard.",
              isLoading: false,
            });
            return;
          }

          try {
            set({ isLoading: true, error: null });
            console.log("Fetching profile for user:", user.uid);

            const response = await API.get(`/user/profile/${user.uid}`);
            console.log("Profile fetch successful:", response.data);

            set({
              userProfile: {
                ...response.data,
                email: response.data.email || user?.email || "",
                photoURL: response.data.profileImage || "",
                isPaid: response.data.isPaid || false,
              },
              error: null,
              isLoading: false,
            });
          } catch (error) {
            console.error("Error fetching user profile:", error);

            if (error.response && error.response.status === 404) {
              set({
                userProfile: {
                  ...get().userProfile,
                  email: user?.email || "",
                  username: user?.displayName || "",
                  isPaid: false,
                },
                error:
                  "Profile not found. You can create your profile in the Profile section.",
                isLoading: false,
              });
            } else {
              set({
                userProfile: {
                  ...get().userProfile,
                  email: user?.email || "",
                  username: user?.displayName || "",
                  isPaid: false,
                },
                error: "Failed to fetch profile.",
                isLoading: false,
              });
            }
          }
        },
        navigateToItem: (item, navigate) => {
          const itemRouteMap = {
            todoList: "/dashboard/tasks",
            projectDashboard: "/dashboard/projects",
            aiCreator: "/dashboard/ai-creator",
          };

          const route = itemRouteMap[item];
          if (route && navigate) {
            navigate(route);
          }
          set({ activeItem: item });
        },

        // Initialize dashboard for desktop/mobile
        initializeDashboard: () => {
          const isDesktop = window.innerWidth >= 1024;
          set({ isExpanded: isDesktop });
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Reset store
        reset: () =>
          set({
            activeItem: "todoList",
            isExpanded: false,
            userProfile: {
              isPaid: false,
              username: "",
              email: "",
              age: "",
              profession: "",
              photoURL: "",
            },
            isLoading: true,
            error: null,
          }),
      }),
      {
        name: "dashboard-store",
        partialize: (state) => ({
          activeItem: state.activeItem,
          isExpanded: state.isExpanded,
          userProfile: state.userProfile,
        }),
      }
    ),
    { name: "dashboard-store" }
  )
);

export default useDashboardStore;
