import api from './api';

// ==================== FOLDER API ====================

export const folderAPI = {
  // Get all folders for the authenticated user
  getFolders: async () => {
    return api.get('/customization/folders');
  },

  // Create a new folder
  createFolder: async (folderData) => {
    return api.post('/customization/folders', folderData);
  },

  // Update an existing folder
  updateFolder: async (id, folderData) => {
    return api.put(`/customization/folders/${id}`, folderData);
  },

  // Delete a folder
  deleteFolder: async (id) => {
    return api.delete(`/customization/folders/${id}`);
  }
};

// ==================== DASHBOARD API ====================

export const customDashboardAPI = {
  // Get all dashboards for the authenticated user
  getDashboards: async () => {
    return api.get('/customization/dashboards');
  },

  // Get a single dashboard
  getDashboard: async (id) => {
    return api.get(`/customization/dashboards/${id}`);
  },

  // Create a new dashboard
  createDashboard: async (dashboardData) => {
    return api.post('/customization/dashboards', dashboardData);
  },

  // Update an existing dashboard
  updateDashboard: async (id, dashboardData) => {
    return api.put(`/customization/dashboards/${id}`, dashboardData);
  },

  // Delete a dashboard
  deleteDashboard: async (id) => {
    return api.delete(`/customization/dashboards/${id}`);
  },

  // Move a dashboard to a folder
  moveDashboard: async (id, folderId) => {
    return api.patch(`/customization/dashboards/${id}/move`, { folderId });
  }
};

// Export both as named exports and combined default
export default {
  folder: folderAPI,
  dashboard: customDashboardAPI
};

