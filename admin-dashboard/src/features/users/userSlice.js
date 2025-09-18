import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../utils/constants';

// Fetch users
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const res = await fetch(API_ENDPOINTS.USERS);
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
});

// Toggle lock/unlock user by updating role
export const toggleLockUser = createAsyncThunk(
  'users/toggleLockUser',
  async ({ userId, lock }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.USERS}/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: lock ? 'locked' : 'user' }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          return rejectWithValue(errorData.message || 'Failed to update user');
        } catch {
          return rejectWithValue('Không thể phân tích lỗi từ server');
        }
      }

      const data = await res.json();
      return { userId, lock, message: data.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(toggleLockUser.pending, (state) => {
        state.error = null;
        state.successMessage = null;
      })
      .addCase(toggleLockUser.fulfilled, (state, action) => {
        const { userId, lock, message } = action.payload;
        const user = state.users.find(u => u._id === userId);
        if (user) {
          user.role = lock ? 'locked' : 'user';
        }
        state.successMessage = message;
      })
      .addCase(toggleLockUser.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export default userSlice.reducer;
