const STORAGE_KEYS = {
  REQUESTS: 'pksk_requests',
  PROFILE: 'pksk_profile',
  MESSAGES: 'pksk_messages',
  USER: 'pksk_user',
  ALL_USERS: 'pksk_all_users',
  BUILDINGS: 'pksk_buildings'
};

export const storage = {
  getBuildings: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.BUILDINGS) || '[]'),
  saveBuilding: (building) => {
    const buildings = storage.getBuildings();
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify([...buildings, building]));
  },
  
  getUsers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_USERS) || '[]'),
  saveUserToDB: (user) => {
    const users = storage.getUsers();
    if (!users.find(u => u.phone === user.phone)) {
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify([...users, user]));
    }
  },
  
  getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  saveUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  logout: () => localStorage.removeItem(STORAGE_KEYS.USER),
  
  getRequests: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'),
  saveRequest: (request) => {
    const requests = storage.getRequests();
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([request, ...requests]));
  },
  updateRequestStatus: (id, status) => {
    const requests = storage.getRequests();
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(updated));
  },
  
  getProfile: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}'),
  saveProfile: (profile) => localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile)),
  
  getMessages: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]'),
  saveMessage: (message) => {
    const messages = storage.getMessages();
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([...messages, message]));
  },
  
  getLanguage: () => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'ru',
  setLanguage: (lang) => localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
};
