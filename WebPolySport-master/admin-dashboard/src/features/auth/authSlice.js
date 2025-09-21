// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAPI } from './authAPI';

const initialState = {
  user: null,
  loading: false,
  error: null,
};

// Thunk: gửi request đăng nhập
export const login = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const user = await loginAPI(formData);
      return user;
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('adminUser');
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        if (action.payload.role === 'admin') {
          localStorage.setItem('adminUser', JSON.stringify(action.payload));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
